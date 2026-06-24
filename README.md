# Digital Invitations 🎉

En webbtjänst för digitala inbjudningar med animerade teman, unika gästkoder och RSVP-funktion.

## Om projektet
Detta är ett examensarbete som ersätter fysiska inbjudningar med digitala alternativ.
Varje gäst får en unik kod för att komma åt sin inbjudan. Administratören kan skapa
inbjudningar, hantera gäster och se statistik via ett adminpanel.

## Tekniker
- **Frontend:** React
- **Backend:** Node.js + Express
- **Databas:** MySQL
- **Betalning:** Stripe
- **Autentisering:** JWT
- **Versionshantering:** Git/GitHub
- **Hosting Backend:** Railway
- **Hosting Frontend:** Vercel (under arbete)

## Funktioner
- 🎨 Animerad videobakgrund och bakgrundsmusik
- 🌍 Flerspråkigt stöd (Svenska/Engelska)
- ⏱️ Nedräkning till evenemanget
- 📍 Google Maps integration
- 👗 Klädkod
- 🗓️ Dagsprogram med tidslinje
- 🏨 Hotellrekommendationer
- 📋 RSVP-formulär för gäster
- 💳 Betalning via Stripe
- 👤 Adminpanel med statistik och gästhantering

## Krav för att köra projektet
- Node.js version 18 eller högre
- MySQL version 8 eller högre
- npm version 9 eller högre

## Installation

### 1. Klona projektet
```bash
git clone https://github.com/ditt-användarnamn/digital-invitations.git
cd digital-invitations
```

### 2. Databas
Importera `digital_invitations.sql` i MySQL:
```bash
mysql -u root -p digital_invitations < digital_invitations.sql
```

### 3. Backend
```bash
cd server
npm install
npm start
```

### 4. Frontend
```bash
cd client
npm install
npm start
```

## Miljövariabler
Skapa en `.env` fil i `server/` mappen. Du kan kopiera `server/.env.example`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=ditt_lösenord
DB_NAME=digital_invitations
DB_PORT=3306
JWT_SECRET=ditt_hemliga_nyckel
STRIPE_SECRET_KEY=din_stripe_nyckel
CLIENT_URL=http://localhost:3000
RESEND_API_KEY=din_resend_api_key
RESEND_FROM_EMAIL=Digital Invitations <din@verifierad-domän.se>
```

`RESEND_API_KEY` och `RESEND_FROM_EMAIL` behövs bara när du vill skicka riktiga e-postinbjudningar från adminpanelen.

Skapa också en `.env` fil i `client/` mappen. Du kan kopiera `client/.env.example`:

```env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_STRIPE_PUBLIC_KEY=din_stripe_public_key
```

När frontend deployas kan `REACT_APP_API_URL` ändras till din Railway-backend.

## Admin-login


E-post:  admin@digital-invitations.se
Lösenord: admin123

## Live demo
- **Backend:** https://digital-invitations-production-766b.up.railway.app
- **Frontend:** Publiceras på Vercel (under arbete)

## Projektstruktur

digital-invitations/
├── client/                  # React frontend
│   ├── public/
│   │   ├── music/           # Bakgrundsmusik
│   │   └── videos/          # Videobakgrund
│   └── src/
│       ├── components/      # MusicPlayer
│       ├── pages/           # Home, Login, AdminPanel, Invitation, Payment
│       └── styles/          # CSS-moduler
├── server/                  # Node.js backend
│   ├── config/              # Databasanslutning
│   ├── controllers/         # Auth, Invitation, Guest
│   ├── middleware/          # JWT-autentisering
│   └── routes/              # API-routes
├── digital_invitations.sql  # Databasschema
└── README.md


## Skolkrav som uppfylls
- ✅ Ramverk – React + Node.js
- ✅ Versionshantering – Git/GitHub med commits
- ✅ E-handel – Stripe betalning
- ✅ Egendesignad databas med 6 tabeller
- ✅ Användarhantering med JWT (admin/gäst)
- ✅ REST API
- ✅ Frontend utan omladdningar (React SPA)
