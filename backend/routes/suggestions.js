const express = require('express');
const Joi = require('joi');
const { optionalAuth } = require('../middleware/auth');
const {
  getMovieSuggestions,
  getPlaceSuggestions,
  getCafeSuggestions,
  getRestaurantSuggestions
} = require('../services/suggestionService');

const router = express.Router();

// Validation schemas
const movieQuerySchema = Joi.object({
  mood: Joi.string().valid('chill', 'action', 'thriller', 'family', 'scifi', 'popular').default('popular'),
  limit: Joi.number().integer().min(1).max(20).default(10),
  language: Joi.string().valid('en', 'hi', 'english', 'hindi').default('en'),
  region: Joi.string().length(2).uppercase().default('US')
});

const placeQuerySchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  type: Joi.string().valid('restaurant', 'cafe', 'bar', 'movie_theater').default('restaurant'),
  radius: Joi.number().integer().min(1000).max(50000).default(5000),
  limit: Joi.number().integer().min(1).max(20).default(10)
});

/**
 * GET /api/v1/suggestions/movies
 * Get movie suggestions based on mood
 */
router.get('/movies', optionalAuth, async (req, res) => {
  try {
    // Validate query parameters
    const { error, value } = movieQuerySchema.validate(req.query, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { mood, limit, language, region } = value;
    const movies = await getMovieSuggestions(mood, limit, language, region);

    res.json({
      results: movies,
      mood,
      language,
      region,
      count: movies.length
    });
  } catch (error) {
    console.error('Get movie suggestions error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/suggestions/places
 * Get place suggestions (restaurants, cafes, etc.) based on location
 */
router.get('/places', optionalAuth, async (req, res) => {
  try {
    // Validate query parameters
    const { error, value } = placeQuerySchema.validate(req.query, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { lat, lng, type, radius, limit } = value;
    const places = await getPlaceSuggestions(lat, lng, type, radius, limit);

    res.json({
      results: places,
      location: { lat, lng },
      type,
      radius,
      count: places.length
    });
  } catch (error) {
    console.error('Get place suggestions error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/suggestions/cafes
 * Get cafe suggestions based on location
 */
router.get('/cafes', optionalAuth, async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseInt(req.query.radius) || 3000;
    const limit = parseInt(req.query.limit) || 10;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const cafes = await getCafeSuggestions(lat, lng, radius, limit);

    res.json({
      results: cafes,
      location: { lat, lng },
      type: 'cafe',
      radius,
      count: cafes.length
    });
  } catch (error) {
    console.error('Get cafe suggestions error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/suggestions/restaurants
 * Get restaurant suggestions based on location
 */
router.get('/restaurants', optionalAuth, async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseInt(req.query.radius) || 5000;
    const limit = parseInt(req.query.limit) || 10;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const restaurants = await getRestaurantSuggestions(lat, lng, radius, limit);

    res.json({
      results: restaurants,
      location: { lat, lng },
      type: 'restaurant',
      radius,
      count: restaurants.length
    });
  } catch (error) {
    console.error('Get restaurant suggestions error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
