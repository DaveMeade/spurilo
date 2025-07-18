/**
 * API utility for making consistent API calls with proper endpoint configuration
 */

// Get API endpoint from config, with fallback for development
const getApiEndpoint = () => {
  // In production, use relative URLs (same origin)
  if (window.location.hostname !== 'localhost') {
    return '';
  }
  
  // In development, check if config is loaded
  if (window.config && window.config.get) {
    const endpoint = window.config.get('app.apiEndpoint');
    if (endpoint) {
      return endpoint;
    }
  }
  
  // Default fallback for development
  return 'http://localhost:8000';
};

/**
 * Make an API request with proper endpoint configuration
 * @param {string} path - The API path (e.g., '/api/users')
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const apiCall = async (path, options = {}) => {
  const apiEndpoint = getApiEndpoint();
  const url = apiEndpoint ? `${apiEndpoint}${path}` : path;
  
  // Add default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add credentials for cross-origin requests in development
  const fetchOptions = {
    ...options,
    headers,
    credentials: apiEndpoint ? 'include' : 'same-origin',
  };
  
  try {
    const response = await fetch(url, fetchOptions);
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

/**
 * Make a GET request
 */
export const apiGet = (path, options = {}) => {
  return apiCall(path, { ...options, method: 'GET' });
};

/**
 * Make a POST request
 */
export const apiPost = (path, data, options = {}) => {
  return apiCall(path, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Make a PUT request
 */
export const apiPut = (path, data, options = {}) => {
  return apiCall(path, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Make a DELETE request
 */
export const apiDelete = (path, options = {}) => {
  return apiCall(path, { ...options, method: 'DELETE' });
};