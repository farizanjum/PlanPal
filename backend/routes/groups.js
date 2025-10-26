const express = require('express');
const Joi = require('joi');
const { authenticateUser } = require('../middleware/auth');
const { createGroup, getGroupById, getUserGroups, joinGroupByCode } = require('../services/groupService');

const router = express.Router();

// Validation schemas
const createGroupSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).allow('', null).optional(),
  group_type: Joi.string().valid('personal', 'work').default('personal').optional(),
  members: Joi.array().items(Joi.string().uuid()).min(1).required()
});

/**
 * POST /api/v1/groups
 * Create a new group
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createGroupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const group = await createGroup(req.user.id, value, token);

    res.status(201).json({
      id: group.id,
      name: group.name,
      created_by: group.created_by,
      members: group.members,
      created_at: group.created_at
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/groups
 * Get all groups for the authenticated user
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const groups = await getUserGroups(req.user.id, token);
    res.json(groups);
  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/groups/:id
 * Get a specific group by ID
 */
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const groupId = req.params.id;

    if (!groupId) {
      return res.status(400).json({ error: 'Group ID is required' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const group = await getGroupById(groupId, req.user.id, token);
    res.json(group);
  } catch (error) {
    console.error('Get group error:', error);

    if (error.message.includes('Access denied') || error.message.includes('not found')) {
      return res.status(403).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/groups/join
 * Join a group using a group code
 */
router.post('/join', authenticateUser, async (req, res) => {
  try {
    const { group_code } = req.body;

    if (!group_code) {
      return res.status(400).json({ error: 'Group code is required' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const group = await joinGroupByCode(req.user.id, group_code, token);

    res.json({
      id: group.id,
      name: group.name,
      group_code: group.group_code,
      message: 'Successfully joined group!'
    });
  } catch (error) {
    console.error('Join group error:', error);

    if (error.message.includes('not found') || error.message.includes('already a member')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/groups/:id
 * Delete a group (soft delete)
 */
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const groupId = req.params.id;
    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7);
    
    const { deleteGroup } = require('../services/groupService');
    await deleteGroup(groupId, req.user.id, token);
    
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    
    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/groups/:groupId/members/:memberId
 * Remove a member from a group
 */
router.delete('/:groupId/members/:memberId', authenticateUser, async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7);
    
    const { removeMemberFromGroup } = require('../services/groupService');
    await removeMemberFromGroup(groupId, memberId, req.user.id, token);
    
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    
    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/groups/:groupId/location
 * Get majority location for group recommendations
 */
router.get('/:groupId/location', authenticateUser, async (req, res) => {
  try {
    const { groupId } = req.params;
    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7);
    
    const { getGroupRecommendations } = require('../services/locationService');
    const recommendations = await getGroupRecommendations(groupId, token);
    
    res.json(recommendations);
  } catch (error) {
    console.error('Get group location error:', error);
    
    if (error.message.includes('not found') || error.message.includes('No location')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
