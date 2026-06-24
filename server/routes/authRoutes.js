const express = require('express');
const router = express.Router();
const { login, changePassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/auth/login - Logga in admin
router.post('/login', login);

// PUT /api/auth/change-password - Byt lösenord för inloggad admin
router.put('/change-password', authMiddleware, changePassword);

module.exports = router;
