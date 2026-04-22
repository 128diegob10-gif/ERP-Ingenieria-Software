const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/login', controller.login);
router.get('/me', authenticate, controller.me);

module.exports = router;
