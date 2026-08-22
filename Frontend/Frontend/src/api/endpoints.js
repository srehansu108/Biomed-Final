// Use import.meta.env instead of process.env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: `${API_URL}/auth/register`,
    LOGIN: `${API_URL}/auth/login`,
    LOGOUT: `${API_URL}/auth/logout`,
    REFRESH_TOKEN: `${API_URL}/auth/refresh-token`,
    VERIFY_FINGERPRINT: `${API_URL}/auth/verify-fingerprint`,
  },
  
  // Users
  USERS: {
    PROFILE: `${API_URL}/users/profile`,
    UPDATE_PROFILE: `${API_URL}/users/profile`,
    GET_ALL: `${API_URL}/users`,
    GET_BY_ID: (id) => `${API_URL}/users/${id}`,
    UPDATE_STATUS: (id) => `${API_URL}/users/${id}/status`,
    DELETE: (id) => `${API_URL}/users/${id}`,
  },
  
  // Fingerprints
  FINGERPRINTS: {
    CAPTURE: `${API_URL}/fingerprints/capture`,
    ENROLL: `${API_URL}/fingerprints/enroll`,
    GET_MY_FINGERPRINTS: `${API_URL}/fingerprints/my-fingerprints`,
    DELETE: (id) => `${API_URL}/fingerprints/${id}`,
    VERIFY: `${API_URL}/fingerprints/verify`,
    VERIFY_MULTIPLE: `${API_URL}/fingerprints/verify-multiple`,
  },
};