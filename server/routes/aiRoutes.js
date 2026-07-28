const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/', aiController.runGemini);

module.exports = router;
