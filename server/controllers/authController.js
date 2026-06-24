const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Logga in admin
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Databasen kunde inte nås.' });
      }

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

const changePassword = (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Fyll i nuvarande och nytt lösenord.' });
  }

  if (newPassword.length < 10) {
    return res.status(400).json({ message: 'Det nya lösenordet måste ha minst 10 tecken.' });
  }

  db.query('SELECT password FROM users WHERE id = ?', [req.user.id], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Databasen kunde inte nås.' });
    if (results.length === 0) return res.status(404).json({ message: 'Admin hittades inte.' });

    const validPassword = await bcrypt.compare(currentPassword, results[0].password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Nuvarande lösenord är fel.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id], (updateErr) => {
      if (updateErr) return res.status(500).json({ message: 'Lösenordet kunde inte sparas.' });
      res.json({ message: 'Lösenordet är ändrat. Logga in igen.' });
    });
  });
};

module.exports = { login, changePassword };
