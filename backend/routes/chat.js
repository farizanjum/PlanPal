const express = require('express');
const Joi = require('joi');
const { authenticateUser } = require('../middleware/auth');
const { sendMessage, getGroupMessages, getRecentMessages } = require('../services/chatService');
const { generateChatbotResponse } = require('../services/chatbotService');
const { createUserClient } = require('../config/supabase');

const router = express.Router();

// Validation schemas
const sendMessageSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
  message_type: Joi.string().valid('text', 'image', 'system', 'bot_query').default('text')
});

const getMessagesSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0)
});

/**
 * POST /api/v1/chat/:groupId/messages
 * Send a message to a group chat
 */
router.post('/:groupId/messages', authenticateUser, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Validate request body
    const { error, value } = sendMessageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { message, message_type } = value;

    // Create user-scoped Supabase client
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const supabase = createUserClient(token);

    // Check if user is member of the group
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('members')
      .eq('id', groupId)
      .single();

    if (groupError || !groupData) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!groupData.members.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Save user's message
    const newMessage = await sendMessage(req.user.id, groupId, message, message_type);

    // If message starts with @bot or is of type bot_query, generate AI response
    if (message_type === 'bot_query' || message.toLowerCase().startsWith('@bot ')) {
      try {
        const botQuery = message.toLowerCase().startsWith('@bot ') 
          ? message.substring(5).trim() 
          : message;
        
        const botResponse = await generateChatbotResponse(groupId, botQuery, req.user.id);
        
        // Send bot response as system message
        const botMessage = await sendMessage(null, groupId, botResponse, 'system');
        
        return res.status(201).json({
          userMessage: newMessage,
          botMessage: botMessage
        });
      } catch (botError) {
        console.error('Chatbot error:', botError);
        // Continue with just the user message if bot fails
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/chat/:groupId/messages
 * Get messages for a group chat
 */
router.get('/:groupId/messages', authenticateUser, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Validate query parameters
    const { error, value } = getMessagesSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { limit, offset } = value;

    // Create user-scoped Supabase client
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const supabase = createUserClient(token);

    // Check if user is member of the group
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('members')
      .eq('id', groupId)
      .single();

    if (groupError || !groupData) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!groupData.members.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await getGroupMessages(groupId, limit, offset);

    res.json({
      messages,
      group_id: groupId,
      count: messages.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/chat/:groupId/recent
 * Get recent messages for a group (last 24 hours)
 */
router.get('/:groupId/recent', authenticateUser, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Create user-scoped Supabase client
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const supabase = createUserClient(token);

    // Check if user is member of the group
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('members')
      .eq('id', groupId)
      .single();

    if (groupError || !groupData) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!groupData.members.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await getRecentMessages(groupId);

    res.json({
      messages,
      group_id: groupId,
      count: messages.length,
      timeframe: 'last 24 hours'
    });
  } catch (error) {
    console.error('Get recent messages error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
