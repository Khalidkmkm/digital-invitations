// stripeRoutes.js – Hanterar Stripe betalningar
const express = require('express');
const router = express.Router();
const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

// POST /api/stripe/create-payment-intent
// Skapar en betalning på 99 SEK
router.post('/create-payment-intent', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe är inte konfigurerat lokalt.' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 9900,        // 99 SEK i ören
      currency: 'sek',
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
