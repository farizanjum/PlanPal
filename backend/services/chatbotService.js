const { GoogleGenerativeAI } = require('@google/generative-ai');
const { supabase } = require('../config/supabase');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Check if API key is configured
if (!GEMINI_API_KEY) {
  console.error('⚠️  GEMINI_API_KEY is not configured in .env file!');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * Get group context for chatbot
 * This function NEVER throws - always returns a valid context object
 */
const getGroupContext = async (groupId) => {
  try {
    // Fetch group details
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .is('deleted_at', null)
      .single();

    if (groupError || !group) {
      console.error('Group fetch error:', groupError);
      // Return minimal context instead of throwing
      return {
        group: {
          name: 'Unknown Group',
          description: 'No description',
          type: 'personal',
          memberCount: 0
        },
        events: [],
        polls: []
      };
    }

    // Fetch events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('group_id', groupId)
      .order('date_time', { ascending: true });

    if (eventsError) {
      console.error('Events fetch error:', eventsError);
    }

    // Fetch polls - note: polls might be linked to events, not groups directly
    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select('*, poll_options(*)')
      .in('event_id', events?.map(e => e.id) || [])
      .limit(10);

    if (pollsError) {
      console.error('Polls fetch error:', pollsError);
    }

    return {
      group: {
        name: group.name || 'Group',
        description: group.description || 'No description',
        type: group.group_type || 'personal',
        memberCount: Array.isArray(group.members) ? group.members.length : 0
      },
      events: events || [],
      polls: polls || []
    };
  } catch (error) {
    console.error('Error fetching group context:', error);
    // Return minimal context instead of throwing
    return {
      group: {
        name: 'Group',
        description: 'No description',
        type: 'personal',
        memberCount: 0
      },
      events: [],
      polls: []
    };
  }
};

/**
 * Generate chatbot response using Gemini AI
 * This function NEVER throws - always returns a string response
 */
const generateChatbotResponse = async (groupId, userMessage, userId) => {
  try {
    console.log('generateChatbotResponse called:', { groupId, userMessage, userId });
    
    if (!GEMINI_API_KEY || !genAI) {
      console.error('Gemini API key not configured');
      return 'Sorry, the chatbot is not configured yet. Please ask your administrator to add the GEMINI_API_KEY to the .env file. Get your key from: https://aistudio.google.com/app/apikey';
    }

    // Get group context - this never throws
    console.log('Fetching group context...');
    const context = await getGroupContext(groupId);
    console.log('Group context fetched:', { groupName: context.group.name, eventsCount: context.events.length });

    // Build system prompt with context
    const systemPrompt = `You are an AI assistant for a group planning app called PlanPal. 
You help groups plan outings, create events, manage polls, and suggest activities.

**Group Information:**
- Group Name: ${context.group.name}
- Description: ${context.group.description || 'No description'}
- Type: ${context.group.type}
- Members: ${context.group.memberCount}

**Current Events:**
${context.events.length > 0 ? context.events.map(e => `- ${e.title} on ${e.date_time ? new Date(e.date_time).toLocaleDateString() : 'TBD'}: ${e.description || 'No description'}`).join('\n') : 'No upcoming events'}

**Active Polls:**
${context.polls.length > 0 ? context.polls.map(p => `- ${p.question} (${p.poll_options?.length || 0} options)`).join('\n') : 'No active polls'}

**Your Capabilities:**
1. Answer questions about events, polls, and group activities
2. Suggest movies based on mood and preferences (action, thriller, comedy, family, sci-fi)
3. Suggest places to visit (restaurants, cafes, parks, etc.)
4. Help create event ideas
5. Help create poll questions
6. Provide information about group members and activities

**Restrictions:**
- ONLY respond to queries related to group planning, events, polls, movies, places, and activities
- Do NOT answer general knowledge questions unrelated to the group
- Do NOT engage in off-topic conversations
- If asked something unrelated, politely redirect to group-related topics

**User Query:**
${userMessage}

**Response Guidelines:**
- Be concise and helpful (max 200 words)
- If suggesting movies, mention 2-3 specific titles with brief descriptions
- If suggesting places, describe the type of venue
- If user wants to create something (event/poll), provide step-by-step guidance
- Always stay within the scope of group planning and activities`;

    console.log('Calling Gemini API...');
    
    // Using gemini-2.0-flash-exp - the latest free model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Gemini response received successfully, length:', text.length);
    return text;
  } catch (error) {
    console.error('❌ Gemini API error details:', error.message, error.stack);
    
    // Return helpful error message based on error type
    if (!GEMINI_API_KEY) {
      return 'The chatbot is not configured. Please add your GEMINI_API_KEY to the .env file. Get it from: https://aistudio.google.com/app/apikey';
    }
    
    if (error.message?.includes('API key')) {
      return 'There is an issue with the API key configuration. Please verify your GEMINI_API_KEY is correct.';
    }
    
    if (error.message?.includes('quota')) {
      return 'The API quota has been exceeded. Please try again later or upgrade your API plan.';
    }
    
    // Generic fallback
    return `I'm having trouble responding right now. Error: ${error.message || 'Unknown error'}. Please try again in a moment!`;
  }
};

/**
 * Parse chatbot response for actions (create event, create poll)
 */
const parseActionFromResponse = (response) => {
  const actions = {
    createEvent: null,
    createPoll: null
  };

  // Check if response suggests creating an event
  const eventMatch = response.match(/CREATE_EVENT:\s*({[^}]+})/i);
  if (eventMatch) {
    try {
      actions.createEvent = JSON.parse(eventMatch[1]);
    } catch (e) {
      console.error('Failed to parse event action:', e);
    }
  }

  // Check if response suggests creating a poll
  const pollMatch = response.match(/CREATE_POLL:\s*({[^}]+})/i);
  if (pollMatch) {
    try {
      actions.createPoll = JSON.parse(pollMatch[1]);
    } catch (e) {
      console.error('Failed to parse poll action:', e);
    }
  }

  return actions;
};

module.exports = {
  generateChatbotResponse,
  getGroupContext,
  parseActionFromResponse
};


