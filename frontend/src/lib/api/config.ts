import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  transformResponse: [
    (data) => {
      try {
        // Parse the response data
        const parsed = JSON.parse(data);
        // Ensure we're returning a plain object
        return JSON.parse(JSON.stringify(parsed));
      } catch (error) {
        return data;
      }
    }
  ]
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log errors or handle them globally
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
); 