const express = require('express');
const router = express.Router();
const { createInvitation, getInvitations, updateInvitation, deleteInvitation } = require('../controllers/invitationController');
const authMiddleware = require('../middleware/authMiddleware');

// Alla routes skyddas av authMiddleware (måste vara inloggad)

// POST /api/invitations - Skapa inbjudan
router.post('/', authMiddleware, createInvitation);

// GET /api/invitations - Hämta alla inbjudningar
router.get('/', authMiddleware, getInvitations);

// PUT /api/invitations/:id - Uppdatera en inbjudan
router.put('/:id', authMiddleware, updateInvitation);

// DELETE /api/invitations/:id - Ta bort en inbjudan
router.delete('/:id', authMiddleware, deleteInvitation);

module.exports = router;
