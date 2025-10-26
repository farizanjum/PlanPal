const { createUserClient } = require('../config/supabase');

/**
 * Create a new poll for an event
 */
const createPoll = async (userId, pollData, userToken) => {
  const supabase = createUserClient(userToken);
  const { event_id, question, options } = pollData;

  // First check if user has access to the event (is member of the group)
  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select(`
      id,
      groups!inner(members)
    `)
    .eq('id', event_id)
    .single();

  if (eventError || !eventData) {
    throw new Error('Event not found');
  }

  if (!eventData.groups.members.includes(userId)) {
    throw new Error('Access denied: You are not a member of this group');
  }

  // Validate options format
  if (!Array.isArray(options) || options.length < 2) {
    throw new Error('Poll must have at least 2 options');
  }

  // Ensure each option has id and label
  const validatedOptions = options.map((option, index) => ({
    id: option.id || `opt${index + 1}`,
    label: option.label
  }));

  // Create the poll
  const { data, error } = await supabase
    .from('polls')
    .insert({
      event_id,
      question,
      options: validatedOptions
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Get polls for an event
 */
const getPollsByEventId = async (eventId, userId, userToken) => {
  const supabase = createUserClient(userToken);
  // First check if user has access to the event
  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select(`
      id,
      groups!inner(members)
    `)
    .eq('id', eventId)
    .single();

  if (eventError || !eventData) {
    throw new Error('Event not found');
  }

  if (!eventData.groups.members.includes(userId)) {
    throw new Error('Access denied: You are not a member of this group');
  }

  // Get polls for the event (exclude deleted)
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq('event_id', eventId)
    .is('deleted_at', null) // Exclude deleted polls
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  // Get votes for these polls
  const pollIds = data.map(poll => poll.id);
  const { data: votes, error: votesError } = await supabase
    .from('votes')
    .select('poll_id, user_id, option_id')
    .in('poll_id', pollIds);

  if (votesError) {
    console.warn('Error fetching votes:', votesError);
  }

  // Combine polls with vote counts
  return data.map(poll => {
    const pollVotes = votes?.filter(vote => vote.poll_id === poll.id) || [];
    const voteCounts = {};

    // Count votes for each option
    poll.options.forEach(option => {
      voteCounts[option.id] = pollVotes.filter(vote => vote.option_id === option.id).length;
    });

    // Check if current user has voted
    const userVote = pollVotes.find(vote => vote.user_id === userId);

    return {
      id: poll.id,
      event_id: poll.event_id,
      question: poll.question,
      options: poll.options,
      vote_counts: voteCounts,
      total_votes: pollVotes.length,
      user_vote: userVote ? userVote.option_id : null,
      created_at: poll.created_at
    };
  });
};

/**
 * Cast a vote in a poll
 */
const castVote = async (userId, pollId, optionId, userToken) => {
  const supabase = createUserClient(userToken);

  // First check if user has access to the poll
  const { data: pollData, error: pollError } = await supabase
    .from('polls')
    .select(`
      id,
      options,
      events!inner(
        id,
        groups!inner(members)
      )
    `)
    .eq('id', pollId)
    .single();

  if (pollError || !pollData) {
    throw new Error('Poll not found');
  }

  if (!pollData.events.groups.members.includes(userId)) {
    throw new Error('Access denied: You are not a member of this group');
  }

  // Validate option exists
  const validOption = pollData.options.find(option => option.id === optionId);
  if (!validOption) {
    throw new Error('Invalid option selected');
  }

  // Check if user already voted
  const { data: existingVote, error: voteCheckError } = await supabase
    .from('votes')
    .select('id')
    .eq('poll_id', pollId)
    .eq('user_id', userId)
    .single();

  if (voteCheckError && voteCheckError.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(voteCheckError.message);
  }

  if (existingVote) {
    // Update existing vote
    const { data, error } = await supabase
      .from('votes')
      .update({ option_id: optionId })
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } else {
    // Insert new vote
    const { data, error } = await supabase
      .from('votes')
      .insert({
        poll_id: pollId,
        user_id: userId,
        option_id: optionId
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
};

/**
 * Delete a poll (soft delete)
 */
const deletePoll = async (pollId, userId, userToken) => {
  const supabase = createUserClient(userToken);

  // Get poll and check permissions
  const { data: pollData, error: pollError } = await supabase
    .from('polls')
    .select(`
      id,
      events!inner(
        id,
        created_by,
        groups!inner(created_by)
      )
    `)
    .eq('id', pollId)
    .single();

  if (pollError || !pollData) {
    throw new Error('Poll not found');
  }

  // Only event creator or group creator can delete polls
  const isEventCreator = pollData.events.created_by === userId;
  const isGroupCreator = pollData.events.groups.created_by === userId;

  if (!isEventCreator && !isGroupCreator) {
    throw new Error('Only the event or group creator can delete this poll');
  }

  // Soft delete
  const { error } = await supabase
    .from('polls')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', pollId);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
};

module.exports = {
  createPoll,
  getPollsByEventId,
  castVote,
  deletePoll
};
