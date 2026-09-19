export const BASE_URL = process.env.REACT_APP_BASE_URL || 'https://jobtracker-backend-9dlp.onrender.com';

// CONTACT-US API
export const contactusEndpoint = {
  CONTACT_US_API: BASE_URL + "/send-email",
};

// CONFIG API (Admin Dashboard)
export const configEndpoint = {
  GET_CONFIG: BASE_URL + "/api/v1/config",
  GET_CONFIG_RAW: BASE_URL + "/api/v1/config/raw",
  UPDATE_CONFIG: BASE_URL + "/api/v1/config",
};

// AI API
export const aiEndpoint = {
  GENERATE_AI: BASE_URL + "/api/v1/ai",
};

// RESUME API
export const resumeEndpoint = {
  MASTER_RESUME: BASE_URL + "/api/v1/resume/master",
  TAILORED_RESUME: BASE_URL + "/api/v1/resume/tailored",
  COMPILE_RESUME: BASE_URL + "/api/v1/resume/compile",
};

// OAUTH API (Admin Dashboard — Token Status)
export const oauthEndpoint = {
  OAUTH_STATUS: BASE_URL + "/api/v1/oauth/status",
  OAUTH_REFRESH: BASE_URL + "/api/v1/oauth/refresh",
};
