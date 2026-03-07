const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Registrera admin
const register = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Kolla om email redan finns
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (results.length > 0) {
        return res.status(400).json({ message: 'Email finns redan!' });
      }

      // Kryptera lösenordet
      const hashedPassword = await bcrypt.hash(password, 10);

      // Spara admin i databasen
      db.query('INSERT INTO users (email, password) VALUES (?, ?)', 
        [email, hashedPassword], 
        (err, result) => {
          if (err) return res.status(500).json({ message: 'Något gick fel!' });
          res.status(201).json({ message: 'Admin skapad! ✅' });
        }
      );
    });
  } catch (err) {
    res.status(500).json({ message: 'Serverfel!' });
  }
};

// Logga in admin
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (results.length === 0) {
        return res.status(400).json({ message: 'Fel email eller lösenord!' });
      }

      const user = results[0];

      // Kolla lösenordet
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: 'Fel email eller lösenord!' });
      }

      // Skapa JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ token, message: 'Inloggad! ✅' });
    });
  } catch (err) {
    res.status(500).json({ message: 'Serverfel!' });
  }
};

module.exports = { register, login };