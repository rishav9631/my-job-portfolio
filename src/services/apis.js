const BASE_URL = process.env.REACT_APP_BASE_URL
// CONTACT-US API
export const contactusEndpoint = {
  CONTACT_US_API: BASE_URL + "/send-email",
}

// CONFIG API (Admin Dashboard)
export const configEndpoint = {
  GET_CONFIG: BASE_URL + "/api/v1/config",
  GET_CONFIG_RAW: BASE_URL + "/api/v1/config/raw",
  UPDATE_CONFIG: BASE_URL + "/api/v1/config",
}
