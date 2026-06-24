const db = require('../config/db');
const crypto = require('crypto');

const generateCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getClientUrl = () => {
  return process.env.CLIENT_URL || 'http://localhost:3000';
};

const buildInvitationLink = (code) => {
  return `${getClientUrl()}/invitation/${code}`;
};

const escapeHtml = (value) => {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const sendResendBatch = async (emails) => {
  const response = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emails)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Resend kunde inte skicka e-post.');
  }

  return response.json();
};

const addGuest = (req, res) => {
  const { invitation_id, name, email, phone } = req.body;
  const unique_code = generateCode();
  const sql = `INSERT INTO guests (invitation_id, name, email, phone, unique_code) VALUES (?, ?, ?, ?, ?)`;
  db.query(sql, [invitation_id, name, email, phone || null, unique_code], (err, result) => {
    if (err) return res.status(500).json({ message: 'Något gick fel!' });
    res.status(201).json({
      message: 'Gäst tillagd! ✅',
      guest_id: result.insertId,
      unique_code: unique_code
    });
  });
};

const importGuests = (req, res) => {
  const { invitation_id, guests } = req.body;

  if (!invitation_id || !Array.isArray(guests) || guests.length === 0) {
    return res.status(400).json({ message: 'Välj inbjudan och minst en gäst.' });
  }

  const validGuests = guests
    .filter((guest) => guest && guest.name && (guest.email || guest.phone))
    .slice(0, 500);

  if (validGuests.length === 0) {
    return res.status(400).json({ message: 'CSV-filen saknar giltiga gäster.' });
  }

  const values = validGuests.map((guest) => [
    invitation_id,
    String(guest.name).trim(),
    guest.email ? String(guest.email).trim() : null,
    guest.phone ? String(guest.phone).trim() : null,
    generateCode()
  ]);

  const sql = `INSERT INTO guests (invitation_id, name, email, phone, unique_code) VALUES ?`;
  db.query(sql, [values], (err, result) => {
    if (err) return res.status(500).json({ message: 'Gästerna kunde inte importeras.' });
    res.status(201).json({
      message: `${result.affectedRows} gäster importerades! ✅`,
      imported: result.affectedRows
    });
  });
};

const sendInvitationEmails = (req, res) => {
  const { invitationId } = req.params;
  const userId = req.user.id;

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return res.status(503).json({
      message: 'Resend är inte inställt ännu. Lägg till RESEND_API_KEY och RESEND_FROM_EMAIL i server/.env.'
    });
  }

  const sql = `
    SELECT g.name, g.email, g.unique_code, i.title
    FROM guests g
    INNER JOIN invitations i ON g.invitation_id = i.id
    WHERE i.id = ? AND i.user_id = ? AND g.email IS NOT NULL AND g.email <> ''
    ORDER BY g.id ASC
  `;

  db.query(sql, [invitationId, userId], async (err, guests) => {
    if (err) return res.status(500).json({ message: 'Kunde inte hämta gäster.' });
    if (guests.length === 0) {
      return res.status(400).json({ message: 'Den här inbjudan har inga gäster med e-postadress.' });
    }

    const results = {
      sent: 0,
      failed: 0,
      failedGuests: []
    };

    for (let index = 0; index < guests.length; index += 100) {
      const batch = guests.slice(index, index + 100);
      const emails = batch.map((guest) => {
        const invitationLink = buildInvitationLink(guest.unique_code);
        const guestName = escapeHtml(guest.name);
        const invitationTitle = escapeHtml(guest.title);
        const html = `
          <div style="font-family: Georgia, serif; color: #2c2416; line-height: 1.7;">
            <h1 style="font-weight: 300;">Du är inbjuden</h1>
            <p>Hej ${guestName},</p>
            <p>Här är din personliga inbjudan till <strong>${invitationTitle}</strong>.</p>
            <p>
              <a href="${invitationLink}" style="display: inline-block; padding: 12px 18px; background: #2c2416; color: #c9a96e; text-decoration: none;">
                Öppna inbjudan
              </a>
            </p>
            <p>Din länk: <br><a href="${invitationLink}">${invitationLink}</a></p>
          </div>
        `;

        return {
          from: process.env.RESEND_FROM_EMAIL,
          to: [guest.email],
          subject: `Din inbjudan: ${guest.title || 'Inbjudan'}`,
          html
        };
      });

      try {
        await sendResendBatch(emails);
        results.sent += batch.length;
      } catch (sendError) {
        console.error('E-postbatch misslyckades:', sendError.message);
        results.failed += batch.length;
        results.failedGuests.push(...batch.map((guest) => guest.email));
      }

      if (index + 100 < guests.length) {
        await wait(400);
      }
    }

    res.json({
      message: `${results.sent} e-post skickades. ${results.failed} misslyckades.`,
      ...results
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

module.exports = { addGuest, importGuests, sendInvitationEmails, getInvitationByCode, updateRSVP };
