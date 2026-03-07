// Importerar mysql2 paketet
const mysql = require('mysql2');

// Skapar anslutning till databasen
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// Testar anslutningen
db.connect((err) => {
  if (err) {
    console.error('Databasanslutning misslyckades:', err);
    return;
  }
  console.log('Ansluten till databasen! ✅');
});

module.exports = db;