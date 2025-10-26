const axios = require('axios');

// TMDB API configuration
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Google Places API configuration
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

/**
 * Get movie suggestions based on mood
 */
const getMovieSuggestions = async (mood = 'popular', limit = 10, language = 'en', region = 'IN') => {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB API key not configured');
    }

    let endpoint = '/discover/movie';
    
    // Map language codes first
    const languageMap = {
      'english': 'en',
      'hindi': 'hi',
      'en': 'en',
      'hi': 'hi'
    };
    
    const languageCode = languageMap[language.toLowerCase()] || 'en';
    
    // Add randomness by selecting a random page
    // For Hindi, fetch from more pages to get variety (1-20), for English (1-10)
    const maxPage = languageCode === 'hi' ? 20 : 10;
    const randomPage = Math.floor(Math.random() * maxPage) + 1;
    
    let params = {
      api_key: TMDB_API_KEY,
      language: `${languageCode}`,
      with_original_language: languageCode, // Filter by original language
      sort_by: 'popularity.desc',
      page: randomPage,
      include_adult: true, // Include adult content
      include_video: true, // Include video results
      'vote_count.gte': languageCode === 'hi' ? 10 : 50, // Lower threshold for Hindi movies
      region: region // Add region support for location-based filtering
    };

    // Adjust parameters based on mood
    const moodKey = mood.toLowerCase()
    switch (moodKey) {
      case 'chill':
        params.with_genres = '35,10749,18'; // Comedy, Romance, Drama
        params.sort_by = 'popularity.desc';
        params['vote_count.gte'] = languageCode === 'hi' ? 5 : 50;
        break;
      case 'action':
        params.with_genres = '28,12,53'; // Action, Adventure, Thriller
        params.sort_by = 'popularity.desc';
        break;
      case 'thriller':
        params.with_genres = '53,80,9648'; // Thriller, Crime, Mystery
        params.sort_by = 'popularity.desc';
        break;
      case 'family':
        params.with_genres = '10751,35,16'; // Family, Comedy, Animation
        params.sort_by = 'popularity.desc';
        break;
      case 'scifi':
        params.with_genres = '878,12,28'; // Science Fiction combos
        params.sort_by = 'popularity.desc';
        break;
      default:
        // Default to popular movies
        params.sort_by = 'popularity.desc';
        break;
    }

    console.log('Fetching movies with params:', params);
    let response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, { params });

    // Fallbacks for Hindi when zero results: relax filters and try other endpoints
    if ((!response.data || !response.data.results || response.data.results.length === 0) && languageCode === 'hi') {
      // 1) Remove with_genres constraint
      const relaxed = { ...params }
      delete relaxed.with_genres
      relaxed['vote_count.gte'] = 1
      response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, { params: relaxed })

      if (!response.data?.results?.length) {
        // 2) Try popular endpoint scoped to original language + region
        const popularParams = {
          api_key: TMDB_API_KEY,
          language: languageCode,
          region,
          page: 1
        }
        response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, { params: popularParams })

        if (response.data?.results?.length) {
          // Filter to original language hi
          response.data.results = response.data.results.filter(m => m.original_language === 'hi')
        }
      }
    }

    if (response.data && response.data.results) {
      const movies = response.data.results
        .filter(movie => movie.poster_path && movie.overview) // Filter out movies without posters or descriptions
        .slice(0, limit)
        .map(movie => ({
          id: movie.id,
          title: movie.title,
          overview: movie.overview,
          poster_path: movie.poster_path, // Return path only, frontend will add base URL
          backdrop_path: movie.backdrop_path,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          vote_count: movie.vote_count,
          genre_ids: movie.genre_ids
        }));
      
      console.log(`Fetched ${movies.length} movies for mood: ${mood}`);
      return movies;
    }

    return [];
  } catch (error) {
    console.error('TMDB API error:', error.message);
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
    }
    throw new Error('Failed to fetch movie suggestions');
  }
};

/**
 * Get place suggestions (restaurants, cafes) based on location and type
 */
const getPlaceSuggestions = async (lat, lng, type = 'restaurant', radius = 5000, limit = 10) => {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    if (!lat || !lng) {
      throw new Error('Latitude and longitude are required');
    }

    const params = {
      key: GOOGLE_PLACES_API_KEY,
      location: `${lat},${lng}`,
      radius: radius,
      type: type,
      rankby: 'prominence'
    };

    const response = await axios.get(`${GOOGLE_PLACES_BASE_URL}/nearbysearch/json`, { params });

    if (response.data && response.data.results) {
      // Get detailed information for each place
      const placesWithDetails = await Promise.all(
        response.data.results.slice(0, limit).map(async (place) => {
          try {
            const detailsParams = {
              key: GOOGLE_PLACES_API_KEY,
              place_id: place.place_id,
              fields: 'name,rating,price_level,formatted_address,opening_hours,photos,types'
            };

            const detailsResponse = await axios.get(`${GOOGLE_PLACES_BASE_URL}/details/json`, { params: detailsParams });
            const details = detailsResponse.data.result;

            // Get photo URLs
            let photoUrls = [];
            if (place.photos && place.photos.length > 0) {
              photoUrls = place.photos.slice(0, 5).map(photo => ({
                url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`,
                width: photo.width,
                height: photo.height
              }));
            }

            return {
              id: place.place_id,
              name: place.name,
              rating: place.rating || details?.rating,
              price_level: details?.price_level,
              address: place.vicinity || details?.formatted_address,
              types: place.types,
              photos: photoUrls,
              photo_url: photoUrls.length > 0 ? photoUrls[0].url : null,
              opening_hours: details?.opening_hours,
              location: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng
              }
            };
          } catch (detailsError) {
            console.warn(`Failed to get details for place ${place.place_id}:`, detailsError.message);
            // Get photo URLs for fallback
            let photoUrls = [];
            if (place.photos && place.photos.length > 0) {
              photoUrls = place.photos.slice(0, 5).map(photo => ({
                url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`,
                width: photo.width,
                height: photo.height
              }));
            }

            // Return basic place info if details fail
            return {
              id: place.place_id,
              name: place.name,
              rating: place.rating,
              address: place.vicinity,
              types: place.types,
              photos: photoUrls,
              photo_url: photoUrls.length > 0 ? photoUrls[0].url : null,
              location: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng
              }
            };
          }
        })
      );

      return placesWithDetails;
    }

    return [];
  } catch (error) {
    console.error('Google Places API error:', error.message);
    throw new Error('Failed to fetch place suggestions');
  }
};

/**
 * Get cafe suggestions (convenience method)
 */
const getCafeSuggestions = async (lat, lng, radius = 3000, limit = 10) => {
  return getPlaceSuggestions(lat, lng, 'cafe', radius, limit);
};

/**
 * Get restaurant suggestions (convenience method)
 */
const getRestaurantSuggestions = async (lat, lng, radius = 5000, limit = 10) => {
  return getPlaceSuggestions(lat, lng, 'restaurant', radius, limit);
};

module.exports = {
  getMovieSuggestions,
  getPlaceSuggestions,
  getCafeSuggestions,
  getRestaurantSuggestions
};
