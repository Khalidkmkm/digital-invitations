const db = require('../config/db');
const crypto = require('crypto');

const generateCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

const addGuest = (req, res) => {
  const { invitation_id, name, email } = req.body;
  const unique_code = generateCode();
  const sql = `INSERT INTO guests (invitation_id, name, email, unique_code) VALUES (?, ?, ?, ?)`;
  db.query(sql, [invitation_id, name, email, unique_code], (err, result) => {
    if (err) return res.status(500).json({ message: 'Något gick fel!' });
    res.status(201).json({
      message: 'Gäst tillagd! ✅',
      guest_id: result.insertId,
      unique_code: unique_code
    });
  });
};

const getInvitationByCode = (req, res) => {
  const { code } = req.params;
  const sql = `
    SELECT i.*, g.name as guest_name, g.unique_code, g.rsvp_status
    FROM guests g
    JOIN invitations i ON g.invitation_id = i.id
    WHERE g.unique_code = ?
  `;
  db.query(sql, [code], (err, results) => {
    if (err) return res.status(500).json({ message: 'Något gick fel!' });
    if (results.length === 0) return res.status(404).json({ message: 'Inbjudan hittades inte!' });

    const invitation = results[0];

    const programmeSql = `SELECT * FROM programme WHERE invitation_id = ? ORDER BY time ASC`;
    db.query(programmeSql, [invitation.id], (err2, programmeResults) => {
      if (err2) return res.status(500).json({ message: 'Något gick fel!' });
      invitation.programme = programmeResults;
      res.json(invitation);
    });
  });
};

const updateRSVP = (req, res) => {
  const { code } = req.params;
  const { rsvp_status, dietary_requirements, bringing_children, message } = req.body;
  const sql = `UPDATE guests SET rsvp_status = ?, dietary_requirements = ?, 
               bringing_children = ?, message = ? WHERE unique_code = ?`;
  db.query(sql, [rsvp_status, dietary_requirements, bringing_children, message, code],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Något gick fel!' });
      res.json({ message: 'RSVP sparat! ✅' });
    }
  );
};

module.exports = { addGuest, getInvitationByCode, updateRSVP };