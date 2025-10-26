const express = require('express');
const Joi = require('joi');
const { authenticateUser } = require('../middleware/auth');
const { createEvent, getEventsByGroupId, getEventById } = require('../services/eventService');

const router = express.Router();

// Validation schemas
const createEventSchema = Joi.object({
  group_id: Joi.string().uuid().required(),
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).allow('', null).optional(),
  date_time: Joi.date().iso().allow(null).optional(),
  location: Joi.object({
    name: Joi.string().allow('').optional(),
    lat: Joi.number().min(-90).max(90).allow(null).optional(),
    lng: Joi.number().min(-180).max(180).allow(null).optional(),
    address: Joi.string().allow('', null).optional()
  }).allow(null).optional()
});

/**
 * POST /api/v1/events
 * Create a new event
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createEventSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const event = await createEvent(req.user.id, value, token);

    res.status(201).json({
      id: event.id,
      group_id: event.group_id,
      title: event.title,
      description: event.description,
      date_time: event.date_time,
      location: event.location,
      created_by: event.created_by,
      created_at: event.created_at
    });
  } catch (error) {
    console.error('Create event error:', error);

    if (error.message.includes('Access denied') || error.message.includes('not found')) {
      return res.status(403).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/events/:group_id
 * Get all events for a group
 */
router.get('/:group_id', authenticateUser, async (req, res) => {
  try {
    const groupId = req.params.group_id;

    if (!groupId) {
      return res.status(400).json({ error: 'Group ID is required' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const events = await getEventsByGroupId(groupId, req.user.id, token);
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);

    if (error.message.includes('Access denied') || error.message.includes('not found')) {
      return res.status(403).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/events/event/:id
 * Get a specific event by ID
 */
router.get('/event/:id', authenticateUser, async (req, res) => {
  try {
    const eventId = req.params.id;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const event = await getEventById(eventId, req.user.id);
    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);

    if (error.message.includes('Access denied') || error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/events/:eventId/rsvp
 * RSVP to an event
 */
router.post('/:eventId/rsvp', authenticateUser, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body; // going, maybe, not_going

    if (!['going', 'maybe', 'not_going'].includes(status)) {
      return res.status(400).json({ error: 'Invalid RSVP status' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7);
    
    const { createOrUpdateRSVP } = require('../services/eventService');
    const rsvp = await createOrUpdateRSVP(eventId, req.user.id, status, token);
    
    res.json(rsvp);
  } catch (error) {
    console.error('RSVP error:', error);
    
    if (error.message.includes('not found') || error.message.includes('Access denied')) {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/events/:eventId/rsvps
 * Get RSVPs for an event
 */
router.get('/:eventId/rsvps', authenticateUser, async (req, res) => {
  try {
    const { eventId } = req.params;
    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7);
    
    const { getEventRSVPs } = require('../services/eventService');
    const rsvps = await getEventRSVPs(eventId, req.user.id, token);
    
    res.json(rsvps);
  } catch (error) {
    console.error('Get RSVPs error:', error);
    
    if (error.message.includes('not found') || error.message.includes('Access denied')) {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/events/:eventId/react
 * React to an event
 */
router.post('/:eventId/react', authenticateUser, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { reaction_type } = req.body; // like, love, fire, sad, thinking

    if (!['like', 'love', 'fire', 'sad', 'thinking'].includes(reaction_type)) {
      return res.status(400).json({ error: 'Invalid reaction type' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7);
    
    const { createOrUpdateReaction } = require('../services/eventService');
    const reaction = await createOrUpdateReaction(eventId, req.user.id, reaction_type, token);
    
    res.json(reaction);
  } catch (error) {
    console.error('Reaction error:', error);
    
    if (error.message.includes('not found') || error.message.includes('Access denied')) {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/events/:eventId/reactions
 * Get reactions for an event
 */
router.get('/:eventId/reactions', authenticateUser, async (req, res) => {
  try {
    const { eventId } = req.params;
    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7);
    
    const { getEventReactions } = require('../services/eventService');
    const reactions = await getEventReactions(eventId, req.user.id, token);
    
    res.json(reactions);
  } catch (error) {
    console.error('Get reactions error:', error);
    
    if (error.message.includes('not found') || error.message.includes('Access denied')) {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/events/:eventId
 * Delete an event
 */
router.delete('/:eventId', authenticateUser, async (req, res) => {
  try {
    const { eventId } = req.params;
    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7);
    
    const { createUserClient } = require('../config/supabase');
    const supabase = createUserClient(token);
    
    // Check if user is the event creator
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('created_by')
      .eq('id', eventId)
      .single();
    
    if (fetchError || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (event.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Only the event creator can delete this event' });
    }
    
    // Delete the event
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);
    
    if (error) throw error;
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
