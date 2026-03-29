import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from '../styles/Payment.module.css';

function PaymentSuccess() {
  const navigate = useNavigate();
  const { code } = useParams();

  return (
    <div className={styles.container}>
      <p style={{ fontSize: '60px' }}>🎉</p>
      <h1 className={styles.title}>Tack för din betalning!</h1>
      <p className={styles.subtitle}>Din inbjudan är nu upplåst</p>

      <button
        className={styles.btn}
        onClick={() => navigate(`/invitation/${code}`)}
      >
        SE DIN INBJUDAN
      </button>
    </div>
  );
}

export default PaymentSuccess;