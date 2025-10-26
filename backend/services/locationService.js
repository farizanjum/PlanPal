const { createUserClient } = require('../config/supabase');

/**
 * Get the majority location from a group's members
 * Returns the most common location or centroid if locations are coordinates
 */
const getMajorityLocation = async (groupId, userToken) => {
  const supabase = createUserClient(userToken);

  // Get group with members
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('members')
    .eq('id', groupId)
    .single();

  if (groupError || !group) {
    throw new Error('Group not found');
  }

  // Get member profiles with locations
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, location, location_lat, location_lng')
    .in('id', group.members);

  if (profilesError) {
    throw new Error('Failed to fetch member profiles');
  }

  // Filter members with valid locations
  const membersWithLocation = profiles.filter(p => p.location || (p.location_lat && p.location_lng));

  if (membersWithLocation.length === 0) {
    return null; // No members have location data
  }

  // Try text-based location first (city/region names)
  const textLocations = membersWithLocation
    .filter(p => p.location)
    .map(p => p.location.toLowerCase().trim());

  if (textLocations.length > 0) {
    // Count frequency of each location
    const frequency = {};
    textLocations.forEach(loc => {
      frequency[loc] = (frequency[loc] || 0) + 1;
    });

    // Find most common location
    const majorityLocation = Object.keys(frequency).reduce((a, b) => 
      frequency[a] > frequency[b] ? a : b
    );

    return {
      type: 'text',
      location: majorityLocation,
      count: frequency[majorityLocation],
      totalMembers: membersWithLocation.length,
      percentage: Math.round((frequency[majorityLocation] / membersWithLocation.length) * 100)
    };
  }

  // Fall back to coordinate-based centroid calculation
  const coordLocations = membersWithLocation.filter(p => p.location_lat && p.location_lng);

  if (coordLocations.length > 0) {
    // Calculate centroid (average of all coordinates)
    const avgLat = coordLocations.reduce((sum, p) => sum + p.location_lat, 0) / coordLocations.length;
    const avgLng = coordLocations.reduce((sum, p) => sum + p.location_lng, 0) / coordLocations.length;

    return {
      type: 'coordinates',
      lat: avgLat,
      lng: avgLng,
      count: coordLocations.length,
      totalMembers: membersWithLocation.length
    };
  }

  return null;
};

/**
 * Get recommendations based on group's majority location
 */
const getGroupRecommendations = async (groupId, userToken) => {
  const majorityLocation = await getMajorityLocation(groupId, userToken);

  if (!majorityLocation) {
    throw new Error('No location data available for group members');
  }

  // Return location info for use in recommendations
  return {
    location: majorityLocation,
    recommendationsNote: majorityLocation.type === 'text' 
      ? `Based on majority location: ${majorityLocation.location} (${majorityLocation.percentage}% of members)`
      : `Based on group centroid: ${majorityLocation.lat.toFixed(2)}, ${majorityLocation.lng.toFixed(2)}`
  };
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees) => degrees * (Math.PI / 180);

module.exports = {
  getMajorityLocation,
  getGroupRecommendations,
  calculateDistance
};

