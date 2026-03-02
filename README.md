# Digital Invitations 🎉

En webbtjänst för digitala inbjudningar med animerade teman, unika gästkoder och RSVP-funktion.

## Om projektet
Detta är ett examensarbete som ersätter fysiska inbjudningar med digitala alternativ.
Varje gäst får en unik kod för att komma åt sin inbjudan.

## Tekniker
- **Frontend:** React
- **Backend:** Node.js + Express
- **Databas:** MySQL
- **Betalning:** Stripe
- **Versionshantering:** Git/GitHub

## Krav för att köra projektet
- Node.js version 18 eller högre
- MySQL version 8 eller högre
- npm version 9 eller högre

## Installation

### Backend
```bash
cd server
npm install
```

### Frontend
```bash
cd client
npm install
npm start
```

## Miljövariabler
Skapa en `.env` fil i server-mappen med följande:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=ditt_lösenord
DB_NAME=digital_invitations
JWT_SECRET=ditt_hemliga_nyckel
STRIPE_SECRET_KEY=din_stripe_nyckel
```

## Skolkrav som uppfylls
- ✅ Egendesignad databas med flera tabeller
- ✅ Användarhantering med olika nivåer (admin/gäst)
- ✅ Koppling till betallösning (Stripe)
- ✅ REST API
- ✅ Frontend utan omladdningar (React SPA)