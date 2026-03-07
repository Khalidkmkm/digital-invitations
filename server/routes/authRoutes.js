const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// POST /api/auth/register - Registrera admin
router.post('/register', register);

// POST /api/auth/login - Logga in admin
router.post('/login', login);

module.exports = router;