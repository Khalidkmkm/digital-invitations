const express = require('express');
const router = express.Router();
const { addGuest, getInvitationByCode, updateRSVP } = require('../controllers/guestController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/guests - Lägg till gäst (kräver inloggning)
router.post('/', authMiddleware, addGuest);

// GET /api/guests/invitation/:code - Hämta inbjudan via gästkod (ingen inloggning krävs)
router.get('/invitation/:code', getInvitationByCode);

// PUT /api/guests/rsvp/:code - Uppdatera RSVP svar (ingen inloggning krävs)
router.put('/rsvp/:code', updateRSVP);

module.exports = router;