const { createUserClient, supabase: serviceSupabase } = require('../config/supabase');

/**
 * Generate a unique group code
 */
const generateGroupCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Create a new group
 */
const createGroup = async (userId, groupData, userToken) => {
  const { name, members, description, group_type } = groupData;

  // Ensure the creator is in the members array
  if (!members.includes(userId)) {
    members.push(userId);
  }

  // Ensure profile exists for the creator
  const supabase = createUserClient(userToken);

  try {
    // Check if profile exists, if not create it
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('Profile check error:', profileCheckError);
    }

    if (!existingProfile) {
      console.log('Creating profile for user:', userId);

      // Get current user info
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('User fetch error:', userError);
        throw new Error('Failed to get user information');
      }

      if (user) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email,
            avatar_url: user.user_metadata?.avatar_url
          });

        if (insertError) {
          console.error('Profile creation error:', insertError);
          throw new Error('Failed to create user profile');
        }

        console.log('Profile created successfully for user:', userId);
      } else {
        throw new Error('User not authenticated');
      }
    }
  } catch (error) {
    console.error('Profile setup error:', error);
    throw new Error(`Profile setup failed: ${error.message}`);
  }

  // Generate unique group code
  let groupCode;
  let attempts = 0;
  do {
    groupCode = generateGroupCode();
    attempts++;
    if (attempts > 10) {
      throw new Error('Unable to generate unique group code');
    }
  } while (await checkGroupCodeExists(groupCode, userToken));

  const { data, error} = await supabase
    .from('groups')
    .insert({
      name,
      description: description || null,
      group_type: group_type || 'personal',
      created_by: userId,
      members,
      group_code: groupCode,
      is_private: true
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Check if a group code already exists
 */
const checkGroupCodeExists = async (code, userToken) => {
  const supabase = createUserClient(userToken);
  const { data, error } = await supabase
    .from('groups')
    .select('id')
    .eq('group_code', code)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    throw new Error(error.message);
  }

  return !!data;
};

/**
 * Join a group using a group code
 */
const joinGroupByCode = async (userId, groupCode, userToken) => {
  console.log(`[JOIN_DEBUG] Attempting to join group with code: "${groupCode}" for user: ${userId}`);

  // Use service role to bypass RLS for lookup and membership update
  // Still safe because the route is authenticated and we only expose allowed fields back
  const admin = serviceSupabase;

  const upperCode = groupCode.toUpperCase();
  console.log(`[JOIN_DEBUG] Converted to uppercase: "${upperCode}"`);

  // Find the group by code and ensure it's not deleted
  const { data: groupData, error: findError } = await admin
    .from('groups')
    .select('*')
    .eq('group_code', upperCode)
    .is('deleted_at', null)
    .single();

  console.log(`[JOIN_DEBUG] Database lookup result:`, {
    found: !!groupData,
    error: findError?.message,
    groupName: groupData?.name,
    groupCode: groupData?.group_code,
    members: groupData?.members?.length
  });

  if (findError) {
    if (findError.code === 'PGRST116') {
      console.log(`[JOIN_DEBUG] Group not found with code: "${upperCode}"`);
      throw new Error('Group not found with this code');
    }
    console.log(`[JOIN_DEBUG] Database error:`, findError);
    throw new Error(findError.message);
  }

  // Check if user is already a member
  if (groupData.members.includes(userId)) {
    console.log(`[JOIN_DEBUG] User ${userId} is already a member of group "${groupData.name}"`);
    throw new Error('You are already a member of this group');
  }

  console.log(`[JOIN_DEBUG] Adding user ${userId} to group "${groupData.name}"`);

  // Add user to members array
  const updatedMembers = [...groupData.members, userId];

  const { data, error } = await admin
    .from('groups')
    .update({ members: updatedMembers })
    .eq('id', groupData.id)
    .select()
    .single();

  if (error) {
    console.log(`[JOIN_DEBUG] Failed to update group membership:`, error);
    throw new Error(error.message);
  }

  console.log(`[JOIN_DEBUG] Successfully joined group "${data.name}" with code "${data.group_code}"`);
  return data;
};

/**
 * Get a group by ID with member details
 */
const getGroupById = async (groupId, userId, userToken) => {
  const supabase = createUserClient(userToken);

  // First check if user is a member
  const { data: groupData, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (groupError) {
    throw new Error('Group not found');
  }

  // Check if user is a member
  if (!groupData.members.includes(userId)) {
    throw new Error('Access denied: You are not a member of this group');
  }

  // Get member profiles
  const { data: memberProfiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', groupData.members);

  if (profileError) {
    console.warn('Error fetching member profiles:', profileError);
  }

  // Combine group data with member profiles
  const members = groupData.members.map(memberId => {
    const profile = memberProfiles?.find(p => p.id === memberId);
    return {
      id: memberId,
      name: profile?.full_name || 'Unknown User',
      avatar_url: profile?.avatar_url
    };
  });

  return {
    id: groupData.id,
    name: groupData.name,
    group_code: groupData.group_code,
    group_type: groupData.group_type,
    created_by: groupData.created_by,
    members,
    created_at: groupData.created_at
  };
};

/**
 * Get all groups for a user
 */
const getUserGroups = async (userId, userToken) => {
  const supabase = createUserClient(userToken);

  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .contains('members', [userId])
    .is('deleted_at', null) // Exclude deleted groups
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  // Get member profiles for all groups
  const allMemberIds = [...new Set(data.flatMap(group => group.members))];

  const { data: memberProfiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', allMemberIds);

  if (profileError) {
    console.warn('Error fetching member profiles:', profileError);
  }

  // Combine group data with member profiles
  return data.map(group => ({
    id: group.id,
    name: group.name,
    group_code: group.group_code,
    group_type: group.group_type,
    created_by: group.created_by,
    members: group.members.map(memberId => {
      const profile = memberProfiles?.find(p => p.id === memberId);
      return {
        id: memberId,
        name: profile?.full_name || 'Unknown User',
        avatar_url: profile?.avatar_url
      };
    }),
    created_at: group.created_at
  }));
};

/**
 * Delete a group (soft delete)
 */
const deleteGroup = async (groupId, userId, userToken) => {
  const supabase = createUserClient(userToken);

  // Check if user is the creator
  const { data: groupData, error: groupError } = await supabase
    .from('groups')
    .select('created_by')
    .eq('id', groupId)
    .single();

  if (groupError) {
    throw new Error('Group not found');
  }

  if (groupData.created_by !== userId) {
    throw new Error('Only the group creator can delete the group');
  }

  // Soft delete
  const { error } = await supabase
    .from('groups')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', groupId);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
};

/**
 * Remove a member from a group
 */
const removeMemberFromGroup = async (groupId, memberId, requesterId, userToken) => {
  const supabase = createUserClient(userToken);

  // Get group data
  const { data: groupData, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (groupError) {
    throw new Error('Group not found');
  }

  // Check if requester is the creator
  if (groupData.created_by !== requesterId && requesterId !== memberId) {
    throw new Error('Only the group creator or the member themselves can remove the member');
  }

  // Remove member from array
  const updatedMembers = groupData.members.filter(id => id !== memberId);

  if (updatedMembers.length === groupData.members.length) {
    throw new Error('Member not found in group');
  }

  // Update group
  const { error } = await supabase
    .from('groups')
    .update({ members: updatedMembers })
    .eq('id', groupId);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
};

module.exports = {
  createGroup,
  getGroupById,
  getUserGroups,
  joinGroupByCode,
  checkGroupCodeExists,
  deleteGroup,
  removeMemberFromGroup
};
