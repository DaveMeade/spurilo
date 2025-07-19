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

/**
 * Enhanced API fetch function that handles JSON responses and errors
 * @param {string} path - The API path
 * @param {object} options - Fetch options including method, body, etc.
 * @returns {Promise<any>} - Parsed JSON response
 */
export const fetchAPI = async (path, options = {}) => {
  let apiOptions = { ...options };
  
  // If body is provided and method is not GET, stringify it
  if (apiOptions.body && typeof apiOptions.body === 'object') {
    apiOptions.body = JSON.stringify(apiOptions.body);
  }
  
  const response = await apiCall(path, apiOptions);
  
  // Handle different response types
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // If JSON parsing fails, use the default error message
    }
    
    throw new Error(errorMessage);
  }
  
  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  
  return null;
};