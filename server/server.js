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
const invitationRoutes = require('./routes/invitationRoutes');
const guestRoutes = require('./routes/guestRoutes');

// Skapar express-appen
const app = express();

// Middleware - tillåter JSON och kommunikation med React
app.use(cors());
app.use(express.json());

// Använder routes
app.use('/api/auth', authRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/guests', guestRoutes);

// Test route - för att kolla att servern fungerar
app.get('/', (req, res) => {
  res.json({ message: 'Digital Invitations API fungerar! 🎉' });
});

// Startar servern på port 8080
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servern körs på port ${PORT}`);
});

// Stripe routes
const stripeRoutes = require('./routes/stripeRoutes');
app.use('/api/stripe', stripeRoutes);
