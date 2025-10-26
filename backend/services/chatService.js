const { supabase } = require('../config/supabase');

/**
 * Send a message to a group chat
 */
const sendMessage = async (userId, groupId, message, messageType = 'text') => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      group_id: groupId,
      user_id: userId,
      message: message,
      message_type: messageType
    })
    .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `)
    .single();

  if (error) {
    throw new Error('Failed to send message');
  }

  return data;
};

/**
 * Get messages for a group chat
 */
const getGroupMessages = async (groupId, limit = 50, offset = 0) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error('Failed to fetch messages');
  }

  // Return messages in ascending order (oldest first)
  return data.reverse();
};

/**
 * Get recent messages for a group (last 24 hours)
 */
const getRecentMessages = async (groupId) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `)
    .eq('group_id', groupId)
    .gte('created_at', yesterday.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error('Failed to fetch recent messages');
  }

  return data;
};

module.exports = {
  sendMessage,
  getGroupMessages,
  getRecentMessages
};
