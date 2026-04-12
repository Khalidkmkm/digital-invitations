const express = require('express');
const router = express.Router();
const { addGuest, getInvitationByCode, updateRSVP } = require('../controllers/guestController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/guests - Lägg till gäst (kräver inloggning)
router.post('/', authMiddleware, addGuest);

// GET /api/guests - Hämta gäster för inloggad användares inbjudningar (kräver inloggning)
router.get('/', authMiddleware, (req, res) => {
  const db = require('../config/db');
  const userId = req.user.id;
  const sql = `
    SELECT g.*, i.title AS invitation_title
    FROM guests g
    INNER JOIN invitations i ON g.invitation_id = i.id
    WHERE i.user_id = ?
    ORDER BY g.id DESC
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Något gick fel!' });
    res.json(results);
  });
});

// GET /api/guests/invitation/:code - Hämta inbjudan via gästkod (ingen inloggning krävs)
router.get('/invitation/:code', getInvitationByCode);

// PUT /api/guests/rsvp/:code - Uppdatera RSVP svar (ingen inloggning krävs)
router.put('/rsvp/:code', updateRSVP);

module.exports = router;