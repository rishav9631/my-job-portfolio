const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const configController = require('../controllers/configController');

// All config routes are protected by JWT auth
router.get('/', authMiddleware, configController.getConfig);
router.get('/raw', authMiddleware, configController.getConfigRaw);
router.put('/', authMiddleware, configController.updateConfig);

module.exports = router;
