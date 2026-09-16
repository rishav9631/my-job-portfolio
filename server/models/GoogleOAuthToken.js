const mongoose = require('mongoose');

const googleOAuthTokenSchema = new mongoose.Schema({
    // OAuth2 tokens
    accessToken: {
        type: String,
        default: ''
    },
    refreshToken: {
        type: String,
        required: true
    },
    tokenType: {
        type: String,
        default: 'Bearer'
    },
    expiresAt: {
        type: Date,
        default: null
    },
    scope: {
        type: String,
        default: 'https://www.googleapis.com/auth/gmail.send'
    },

    // Client credentials (stored alongside tokens for self-contained refresh)
    clientId: {
        type: String,
        required: true
    },
    clientSecret: {
        type: String,
        required: true
    },

    // Diagnostics
    lastRefreshedAt: {
        type: Date,
        default: null
    },
    lastError: {
        type: String,
        default: ''
    },
    refreshCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('GoogleOAuthToken', googleOAuthTokenSchema);
