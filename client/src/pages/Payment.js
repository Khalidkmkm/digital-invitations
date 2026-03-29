import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/Payment.module.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { code } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vänta tills stripe och elements är redo
    if (!stripe || !elements) return;

    setLoading(true);

    // Bekräfta betalningen
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `http://localhost:3000/payment-success/${code}`,
      },
    });

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <PaymentElement id="payment-element" />
      {error && <p className={styles.error}>{error}</p>}
      <button
        className={styles.btn}
        disabled={!stripe || loading}
      >
        {loading ? 'Bearbetar...' : 'Betala 99 SEK'}
      </button>
    </form>
  );
}

function Payment() {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    axios.post('http://localhost:8080/api/stripe/create-payment-intent')
      .then(res => setClientSecret(res.data.clientSecret))
      .catch(err => console.error(err));
  }, []);

  const options = {
    clientSecret,
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Betalning</h1>
      <p className={styles.subtitle}>99 SEK för att se din inbjudan</p>

      {/* Visa bara formuläret när clientSecret finns */}
      {clientSecret ? (
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm />
        </Elements>
      ) : (
        <p>Laddar betalning...</p>
      )}
    </div>
  );
}

export default Payment;