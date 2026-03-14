const express = require('express');
const router = express.Router();
const { createInvitation, getInvitations } = require('../controllers/invitationController');
const authMiddleware = require('../middleware/authMiddleware');

// Alla routes skyddas av authMiddleware (måste vara inloggad)

// POST /api/invitations - Skapa inbjudan
router.post('/', authMiddleware, createInvitation);

// GET /api/invitations - Hämta alla inbjudningar
router.get('/', authMiddleware, getInvitations);

module.exports = router;