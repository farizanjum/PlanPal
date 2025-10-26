const express = require('express');
const Joi = require('joi');
const { authenticateUser } = require('../middleware/auth');
const { generateChatbotResponse } = require('../services/chatbotService');

const router = express.Router();

// Validation schema
const chatbotQuerySchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
  groupId: Joi.string().uuid().required()
});

/**
 * POST /api/v1/chatbot/query
 * Send a message to the AI chatbot
 */
router.post('/query', authenticateUser, async (req, res) => {
  try {
    const { error, value } = chatbotQuerySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { message, groupId } = value;
    const userId = req.user.id;

    console.log('Chatbot query received:', { groupId, message, userId });

    // Generate response using Gemini AI - this function now never throws
    const response = await generateChatbotResponse(groupId, message, userId);

    console.log('Chatbot response generated:', response.substring(0, 100) + '...');

    // Save bot message to database using service role (bypasses RLS)
    const { supabase } = require('../config/supabase');
    const { randomUUID } = require('crypto');

    // Resolve bot user id (UUID). Prefer env var; otherwise ensure a bot profile exists.
    let botUserId = process.env.BOT_USER_ID; // Preferred via env [[memory:7695229]]

    if (!botUserId) {
      try {
        // Try to find an existing bot profile by username
        const { data: existingBot, error: findErr } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', 'planpal-bot')
          .single();

        if (existingBot && existingBot.id) {
          botUserId = existingBot.id;
        } else {
          // Create a bot profile
          const newId = randomUUID();
          const { error: createErr } = await supabase
            .from('profiles')
            .insert([{
              id: newId,
              username: 'planpal-bot',
              full_name: 'PlanPal Bot',
              avatar_url: null,
              email: 'planpal-bot@system.local'
            }]);
          if (createErr) {
            console.error('Failed to create bot profile:', createErr);
          } else {
            botUserId = newId;
            console.log('Created bot profile with id:', botUserId);
          }
        }
      } catch (e) {
        console.error('Bot profile resolution error:', e);
      }
    }

    // Detect which table exists: prefer chat_messages, fallback to messages
    let targetTable = 'chat_messages'
    try {
      const { error: probeError } = await supabase
        .from('chat_messages')
        .select('id')
        .limit(1)
      if (probeError) {
        targetTable = 'messages'
      }
    } catch (e) {
      targetTable = 'messages'
    }

    let insertPayload
    if (targetTable === 'chat_messages') {
      insertPayload = {
        group_id: groupId,
        user_id: botUserId || null,
        message: response,
        message_type: 'text'
      }
    } else {
      insertPayload = {
        group_id: groupId,
        user_id: botUserId || null,
        content: response
      }
    }

    const selectFields = targetTable === 'chat_messages'
      ? 'id, group_id, user_id, message, message_type, created_at'
      : 'id, group_id, user_id, content, created_at'

    const { data: botMessage, error: saveError } = await supabase
      .from(targetTable)
      .insert([insertPayload])
      .select(selectFields)
      .single();

    if (saveError) {
      console.error('Failed to save bot message:', saveError);
    } else {
      console.log('Bot message saved successfully:', botMessage?.id);
    }

    // Always return success with the response and message data
    // Normalize message shape for the frontend
    const normalized = botMessage ? {
      id: botMessage.id,
      group_id: botMessage.group_id,
      user_id: botMessage.user_id,
      message: botMessage.message || botMessage.content,
      message_type: botMessage.message_type || 'text',
      created_at: botMessage.created_at
    } : null

    res.json({
      success: true,
      response,
      message: normalized,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chatbot route error:', error);
    // Even if there's an error, return a helpful message
    res.json({
      success: true,
      response: 'Sorry, I encountered an unexpected error. Please try again or contact support if the issue persists.',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;


