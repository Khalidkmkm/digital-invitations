// Laddar miljövariabler FÖRST - måste vara överst!
const dotenv = require('dotenv');
dotenv.config();

// Importerar nödvändiga paket
const express = require('express');
const cors = require('cors');

// Kopplar till databasen
const db = require('./config/db');

// Importerar routes
const authRoutes = require('./routes/authRoutes');

// Skapar express-appen
const app = express();

// Middleware - tillåter JSON och kommunikation med React
app.use(cors());
app.use(express.json());

// Använder routes
app.use('/api/auth', authRoutes);

// Importerar invitation routes
const invitationRoutes = require('./routes/invitationRoutes');

// Använder invitation routes
app.use('/api/invitations', invitationRoutes);

// Test route - för att kolla att servern fungerar
app.get('/', (req, res) => {
  res.json({ message: 'Digital Invitations API fungerar!  🎉' });
});

// Startar servern på port 8080
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servern körs på port ${PORT}`);
});