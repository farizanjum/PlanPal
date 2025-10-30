const express = require('express');
const Joi = require('joi');
const { authenticateUser } = require('../middleware/auth');
const { createPoll, getPollsByEventId, castVote } = require('../services/pollService');

const router = express.Router();

// Validation schemas
const createPollSchema = Joi.object({
  event_id: Joi.string().uuid().required(),
  question: Joi.string().min(1).max(500).required(),
  options: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      label: Joi.string().min(1).max(200).required()
    })
  ).min(2).max(10).required()
});

const voteSchema = Joi.object({
  option_id: Joi.string().required()
});

/**
 * POST /api/v1/polls
 * Create a new poll for an event
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createPollSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const poll = await createPoll(req.user.id, value, token);

    res.status(201).json({
      id: poll.id,
      event_id: poll.event_id,
      question: poll.question,
      options: poll.options,
      created_at: poll.created_at
    });
  } catch (error) {
    console.error('Create poll error:', error);

    if (error.message.includes('Access denied') || error.message.includes('not found')) {
      return res.status(403).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/polls/:event_id
 * Get all polls for an event
 */
router.get('/:event_id', authenticateUser, async (req, res) => {
  try {
    const eventId = req.params.event_id;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const polls = await getPollsByEventId(eventId, req.user.id, token);
    res.json(polls);
  } catch (error) {
    console.error('Get polls error:', error);

    if (error.message.includes('Access denied') || error.message.includes('not found')) {
      return res.status(403).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/polls/:poll_id/vote
 * Cast a vote in a poll
 */
router.post('/:poll_id/vote', authenticateUser, async (req, res) => {
  try {
    const pollId = req.params.poll_id;

    if (!pollId) {
      return res.status(400).json({ error: 'Poll ID is required' });
    }

    // Validate request body
    const { error, value } = voteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const vote = await castVote(req.user.id, pollId, value.option_id, token);

    res.status(201).json({
      id: vote.id,
      poll_id: vote.poll_id,
      user_id: vote.user_id,
      option_id: vote.option_id,
      created_at: vote.created_at
    });
  } catch (error) {
    console.error('Cast vote error:', error);

    if (error.message.includes('Access denied') || error.message.includes('not found') || error.message.includes('Invalid option')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/polls/:poll_id
 * Delete a poll (soft delete)
 */
router.delete('/:poll_id', authenticateUser, async (req, res) => {
  try {
    const pollId = req.params.poll_id;
    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7);
    
    const { deletePoll } = require('../services/pollService');
    await deletePoll(pollId, req.user.id, token);
    
    res.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    console.error('Delete poll error:', error);
    
    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
