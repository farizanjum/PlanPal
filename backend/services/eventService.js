const { createUserClient } = require('../config/supabase');

/**
 * Create a new event
 */
const createEvent = async (userId, eventData, userToken) => {
  const supabase = createUserClient(userToken);
  const { group_id, title, description, date_time, location } = eventData;

  // First check if user is a member of the group
  const { data: groupData, error: groupError } = await supabase
    .from('groups')
    .select('members')
    .eq('id', group_id)
    .single();

  if (groupError || !groupData) {
    throw new Error('Group not found');
  }

  if (!groupData.members.includes(userId)) {
    throw new Error('Access denied: You are not a member of this group');
  }

  // Create the event
  const { data, error } = await supabase
    .from('events')
    .insert({
      group_id,
      title,
      description,
      date_time,
      location,
      created_by: userId
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Get all events for a group
 */
const getEventsByGroupId = async (groupId, userId, userToken) => {
  const supabase = createUserClient(userToken);

  // First check if user is a member of the group
  const { data: groupData, error: groupError } = await supabase
    .from('groups')
    .select('members')
    .eq('id', groupId)
    .single();

  if (groupError || !groupData) {
    throw new Error('Group not found');
  }

  if (!groupData.members.includes(userId)) {
    throw new Error('Access denied: You are not a member of this group');
  }

  // Get events for the group
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      created_by_profile:profiles!events_created_by_fkey(id, full_name, avatar_url)
    `)
    .eq('group_id', groupId)
    .order('date_time', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  // Format the response
  return data.map(event => ({
    id: event.id,
    group_id: event.group_id,
    title: event.title,
    description: event.description,
    date_time: event.date_time,
    location: event.location,
    created_by: {
      id: event.created_by,
      name: event.created_by_profile?.full_name || 'Unknown User',
      avatar_url: event.created_by_profile?.avatar_url
    },
    created_at: event.created_at
  }));
};

/**
 * Get a specific event by ID
 */
const getEventById = async (eventId, userId) => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      groups!inner(members),
      created_by_profile:profiles!events_created_by_fkey(id, full_name, avatar_url)
    `)
    .eq('id', eventId)
    .single();

  if (error || !data) {
    throw new Error('Event not found');
  }

  // Check if user is a member of the group
  if (!data.groups.members.includes(userId)) {
    throw new Error('Access denied: You are not a member of this group');
  }

  return {
    id: data.id,
    group_id: data.group_id,
    title: data.title,
    description: data.description,
    date_time: data.date_time,
    location: data.location,
    created_by: {
      id: data.created_by,
      name: data.created_by_profile?.full_name || 'Unknown User',
      avatar_url: data.created_by_profile?.avatar_url
    },
    created_at: data.created_at
  };
};

/**
 * Create or update RSVP for an event
 */
const createOrUpdateRSVP = async (eventId, userId, status, userToken) => {
  const supabase = createUserClient(userToken);

  // Check if user has access to the event
  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select('id, groups!inner(members)')
    .eq('id', eventId)
    .single();

  if (eventError || !eventData) {
    throw new Error('Event not found');
  }

  if (!eventData.groups.members.includes(userId)) {
    throw new Error('Access denied: You are not a member of this group');
  }

  // Check if RSVP already exists
  const { data: existingRSVP } = await supabase
    .from('event_rsvps')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (existingRSVP) {
    // Update existing
    const { data, error } = await supabase
      .from('event_rsvps')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from('event_rsvps')
      .insert({ event_id: eventId, user_id: userId, status })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
};

/**
 * Get RSVPs for an event
 */
const getEventRSVPs = async (eventId, userId, userToken) => {
  const supabase = createUserClient(userToken);

  // Check access
  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select('id, groups!inner(members)')
    .eq('id', eventId)
    .single();

  if (eventError || !eventData) {
    throw new Error('Event not found');
  }

  if (!eventData.groups.members.includes(userId)) {
    throw new Error('Access denied: You are not a member of this group');
  }

  // Get RSVPs with user profiles
  const { data, error } = await supabase
    .from('event_rsvps')
    .select(`
      *,
      profiles!inner(id, username, email)
    `)
    .eq('event_id', eventId);

  if (error) throw new Error(error.message);

  // Count by status
  const counts = {
    going: data.filter(r => r.status === 'going').length,
    maybe: data.filter(r => r.status === 'maybe').length,
    not_going: data.filter(r => r.status === 'not_going').length
  };

  return { rsvps: data, counts };
};

/**
 * Create or update reaction for an event
 */
const createOrUpdateReaction = async (eventId, userId, reactionType, userToken) => {
  const supabase = createUserClient(userToken);

  // Check access
  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select('id, groups!inner(members)')
    .eq('id', eventId)
    .single();

  if (eventError || !eventData) {
    throw new Error('Event not found');
  }

  if (!eventData.groups.members.includes(userId)) {
    throw new Error('Access denied: You are not a member of this group');
  }

  // Check if reaction already exists
  const { data: existingReaction } = await supabase
    .from('event_reactions')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (existingReaction) {
    // Update existing
    const { data, error } = await supabase
      .from('event_reactions')
      .update({ reaction_type: reactionType, updated_at: new Date().toISOString() })
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from('event_reactions')
      .insert({ event_id: eventId, user_id: userId, reaction_type: reactionType })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
};

/**
 * Get reactions for an event
 */
const getEventReactions = async (eventId, userId, userToken) => {
  const supabase = createUserClient(userToken);

  // Check access
  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select('id, groups!inner(members)')
    .eq('id', eventId)
    .single();

  if (eventError || !eventData) {
    throw new Error('Event not found');
  }

  if (!eventData.groups.members.includes(userId)) {
    throw new Error('Access denied: You are not a member of this group');
  }

  // Get reactions
  const { data, error } = await supabase
    .from('event_reactions')
    .select('*')
    .eq('event_id', eventId);

  if (error) throw new Error(error.message);

  // Count by type
  const counts = {
    like: data.filter(r => r.reaction_type === 'like').length,
    love: data.filter(r => r.reaction_type === 'love').length,
    fire: data.filter(r => r.reaction_type === 'fire').length,
    sad: data.filter(r => r.reaction_type === 'sad').length,
    thinking: data.filter(r => r.reaction_type === 'thinking').length
  };

  return { reactions: data, counts };
};

module.exports = {
  createEvent,
  getEventsByGroupId,
  getEventById,
  createOrUpdateRSVP,
  getEventRSVPs,
  createOrUpdateReaction,
  getEventReactions
};
