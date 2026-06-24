const db = require('../config/db');

// Skapa en ny inbjudan
const createInvitation = (req, res) => {
  const {
    title,
    event_date,
    location,
    dress_code,
    theme_id,
    language,
    music_file,
    video_background,
    programme = []
  } = req.body;
  const user_id = req.user.id; // Hämtar admin id från JWT token

  // Kontrollerar att alla fält är ifyllda
  if (!title || !event_date || !location) {
    return res.status(400).json({ message: 'Titel, datum och plats krävs!' });
  }

  const validProgramme = Array.isArray(programme)
    ? programme
        .filter((item) => item && item.time && item.activity)
        .slice(0, 20)
    : [];

  const sql = `INSERT INTO invitations 
    (user_id, theme_id, title, event_date, location, dress_code, music_file, video_background, language)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.beginTransaction((transactionError) => {
    if (transactionError) {
      return res.status(500).json({ message: 'Kunde inte starta databassparningen.' });
    }

    db.query(
      sql,
      [
        user_id,
        theme_id,
        title,
        event_date,
        location,
        dress_code,
        music_file || null,
        video_background || null,
        language
      ],
      (invitationError, result) => {
        if (invitationError) {
          return db.rollback(() => {
            res.status(500).json({ message: 'Inbjudan kunde inte sparas.' });
          });
        }

        const finishTransaction = () => {
          db.commit((commitError) => {
            if (commitError) {
              return db.rollback(() => {
                res.status(500).json({ message: 'Inbjudan kunde inte slutföras.' });
              });
            }

            res.status(201).json({
              message: 'Inbjudan skapad! ✅',
              invitation_id: result.insertId
            });
          });
        };

        if (validProgramme.length === 0) {
          return finishTransaction();
        }

        const programmeValues = validProgramme.map((item) => [
          result.insertId,
          String(item.time).slice(0, 10),
          String(item.activity).slice(0, 255)
        ]);

        db.query(
          'INSERT INTO programme (invitation_id, time, activity) VALUES ?',
          [programmeValues],
          (programmeError) => {
            if (programmeError) {
              return db.rollback(() => {
                res.status(500).json({ message: 'Dagsprogrammet kunde inte sparas.' });
              });
            }
            finishTransaction();
          }
        );
      }
    );
  });
};

// Hämta alla inbjudningar för admin
const getInvitations = (req, res) => {
  const user_id = req.user.id;

  db.query('SELECT * FROM invitations WHERE user_id = ?', [user_id],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Något gick fel!' });

      if (results.length === 0) return res.json([]);

      const invitationIds = results.map((invitation) => invitation.id);
      db.query(
        'SELECT * FROM programme WHERE invitation_id IN (?) ORDER BY time ASC',
        [invitationIds],
        (programmeError, programmeResults) => {
          if (programmeError) return res.status(500).json({ message: 'Något gick fel!' });

          const invitationsWithProgramme = results.map((invitation) => ({
            ...invitation,
            programme: programmeResults.filter((item) => item.invitation_id === invitation.id)
          }));

          res.json(invitationsWithProgramme);
        }
      );
    }
  );
};

const updateInvitation = (req, res) => {
  const user_id = req.user.id;
  const invitationId = req.params.id;
  const {
    title,
    event_date,
    location,
    dress_code,
    theme_id,
    language,
    music_file,
    video_background,
    programme = []
  } = req.body;

  if (!title || !event_date || !location) {
    return res.status(400).json({ message: 'Titel, datum och plats krävs!' });
  }

  const validProgramme = Array.isArray(programme)
    ? programme
        .filter((item) => item && item.time && item.activity)
        .slice(0, 20)
    : [];

  db.beginTransaction((transactionError) => {
    if (transactionError) {
      return res.status(500).json({ message: 'Kunde inte starta uppdateringen.' });
    }

    db.query(
      `UPDATE invitations
       SET theme_id = ?, title = ?, event_date = ?, location = ?, dress_code = ?,
           music_file = ?, video_background = ?, language = ?
       WHERE id = ? AND user_id = ?`,
      [
        theme_id,
        title,
        event_date,
        location,
        dress_code,
        music_file || null,
        video_background || null,
        language,
        invitationId,
        user_id
      ],
      (updateError, result) => {
        if (updateError) {
          return db.rollback(() => {
            res.status(500).json({ message: 'Inbjudan kunde inte uppdateras.' });
          });
        }

        if (result.affectedRows === 0) {
          return db.rollback(() => {
            res.status(404).json({ message: 'Inbjudan hittades inte.' });
          });
        }

        db.query('DELETE FROM programme WHERE invitation_id = ?', [invitationId], (deleteProgrammeError) => {
          if (deleteProgrammeError) {
            return db.rollback(() => {
              res.status(500).json({ message: 'Dagsprogrammet kunde inte uppdateras.' });
            });
          }

          const finishTransaction = () => {
            db.commit((commitError) => {
              if (commitError) {
                return db.rollback(() => {
                  res.status(500).json({ message: 'Uppdateringen kunde inte slutföras.' });
                });
              }

              res.json({ message: 'Inbjudan uppdaterad! ✅' });
            });
          };

          if (validProgramme.length === 0) {
            return finishTransaction();
          }

          const programmeValues = validProgramme.map((item) => [
            invitationId,
            String(item.time).slice(0, 10),
            String(item.activity).slice(0, 255)
          ]);

          db.query(
            'INSERT INTO programme (invitation_id, time, activity) VALUES ?',
            [programmeValues],
            (insertProgrammeError) => {
              if (insertProgrammeError) {
                return db.rollback(() => {
                  res.status(500).json({ message: 'Dagsprogrammet kunde inte sparas.' });
                });
              }

              finishTransaction();
            }
          );
        });
      }
    );
  });
};

const deleteInvitation = (req, res) => {
  const user_id = req.user.id;
  const invitationId = req.params.id;

  db.beginTransaction((transactionError) => {
    if (transactionError) {
      return res.status(500).json({ message: 'Kunde inte starta borttagningen.' });
    }

    db.query(
      'SELECT id FROM invitations WHERE id = ? AND user_id = ?',
      [invitationId, user_id],
      (findError, results) => {
        if (findError) {
          return db.rollback(() => {
            res.status(500).json({ message: 'Kunde inte hitta inbjudan.' });
          });
        }

        if (results.length === 0) {
          return db.rollback(() => {
            res.status(404).json({ message: 'Inbjudan hittades inte.' });
          });
        }

        db.query('DELETE FROM guests WHERE invitation_id = ?', [invitationId], (guestError) => {
          if (guestError) {
            return db.rollback(() => {
              res.status(500).json({ message: 'Kunde inte ta bort gäster.' });
            });
          }

          db.query('DELETE FROM programme WHERE invitation_id = ?', [invitationId], (programmeError) => {
            if (programmeError) {
              return db.rollback(() => {
                res.status(500).json({ message: 'Kunde inte ta bort dagsprogram.' });
              });
            }

            db.query('DELETE FROM invitations WHERE id = ? AND user_id = ?', [invitationId, user_id], (deleteError) => {
              if (deleteError) {
                return db.rollback(() => {
                  res.status(500).json({ message: 'Kunde inte ta bort inbjudan.' });
                });
              }

              db.commit((commitError) => {
                if (commitError) {
                  return db.rollback(() => {
                    res.status(500).json({ message: 'Borttagningen kunde inte slutföras.' });
                  });
                }

                res.json({ message: 'Inbjudan borttagen! ✅' });
              });
            });
          });
        });
      }
    );
  });
};

module.exports = { createInvitation, getInvitations, updateInvitation, deleteInvitation };
