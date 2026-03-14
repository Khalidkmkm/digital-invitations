const db = require('../config/db');

// Skapa en ny inbjudan
const createInvitation = (req, res) => {
  const { title, event_date, location, dress_code, theme_id, language } = req.body;
  const user_id = req.user.id; // Hämtar admin id från JWT token

  // Kontrollerar att alla fält är ifyllda
  if (!title || !event_date || !location) {
    return res.status(400).json({ message: 'Titel, datum och plats krävs!' });
  }

  // Sparar inbjudan i databasen
  const sql = `INSERT INTO invitations 
    (user_id, theme_id, title, event_date, location, dress_code, language) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.query(sql, [user_id, theme_id, title, event_date, location, dress_code, language],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Något gick fel!' });
      res.status(201).json({ 
        message: 'Inbjudan skapad! ✅',
        invitation_id: result.insertId 
      });
    }
  );
};

// Hämta alla inbjudningar för admin
const getInvitations = (req, res) => {
  const user_id = req.user.id;

  db.query('SELECT * FROM invitations WHERE user_id = ?', [user_id],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Något gick fel!' });
      res.json(results);
    }
  );
};

module.exports = { createInvitation, getInvitations };