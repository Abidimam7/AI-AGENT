// src/utils/api.js
import axios from 'axios';

// Use the API base URL from the environment variable
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

// Optionally, you can provide a fallback URL if needed:
// const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  // You can add default headers or other configurations here if needed
});

export default api;
