const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { supabase, createUserClient } = require('../config/supabase');

// Get user profile
router.get('/', authenticateUser, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const userClient = createUserClient(token);
    
    const { data, error } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/', authenticateUser, async (req, res) => {
  try {
    const { full_name, email, phone_number } = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const userClient = createUserClient(token);

    // Check if profile exists, if not create it
    const { data: existingProfile } = await userClient
      .from('profiles')
      .select('id')
      .eq('id', req.user.id)
      .single();

    let result;
    if (!existingProfile) {
      // Create new profile
      const { data, error } = await userClient
        .from('profiles')
        .insert({
          id: req.user.id,
          full_name,
          email: email || req.user.email,
          phone_number
        })
        .select()
        .single();

      if (error) {
        console.error('Create profile error:', error);
        return res.status(500).json({ error: 'Failed to create profile' });
      }
      result = data;
    } else {
      // Update existing profile
      const { data, error } = await userClient
        .from('profiles')
        .update({
          full_name,
          email,
          phone_number,
          updated_at: new Date().toISOString()
        })
        .eq('id', req.user.id)
        .select()
        .single();

      if (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
      }
      result = data;
    }

    res.json(result);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get group members profiles
router.get('/group/:groupId', authenticateUser, async (req, res) => {
  try {
    const { groupId } = req.params;
    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const userClient = createUserClient(token);

    console.log('Fetching group members for group:', groupId);

    // First check if user is member of the group
    const { data: groupData, error: groupError } = await userClient
      .from('groups')
      .select('members')
      .eq('id', groupId)
      .single();

    if (groupError) {
      console.error('Group fetch error:', groupError);
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!groupData) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!groupData.members.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log('Fetching profiles for members:', groupData.members);

    // Use service role to bypass RLS for profile lookup
    // This is safe because we've verified user is a group member above
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', groupData.members);

    if (error) {
      console.error('Profiles fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch member profiles' });
    }

    console.log('Fetched profiles:', data);
    res.json(data || []);
  } catch (error) {
    console.error('Get group members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
