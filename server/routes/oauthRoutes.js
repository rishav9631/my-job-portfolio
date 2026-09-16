const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const oauthController = require('../controllers/oauthController');

// All OAuth routes are protected by JWT auth
router.get('/status', authMiddleware, oauthController.getOAuthStatus);
router.post('/initialize', authMiddleware, oauthController.initializeOAuth);
router.post('/refresh', authMiddleware, oauthController.forceRefreshOAuth);

module.exports = router;
