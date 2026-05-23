// src/components/AgeGate.jsx
import React, { useState } from 'react';

export default function AgeGate({ onConfirm }) {
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');

  function handleConfirm() {
    if (!dob) { setError('Please enter your date of birth.'); return; }
    const age = Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) { setError('You must be 18 or older to access this site.'); return; }
    localStorage.setItem('age_verified', 'true');
    localStorage.setItem('age_verified_at', Date.now());
    onConfirm();
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.icon}>🔞</div>
        <h1 style={styles.title}>Adults Only</h1>
        <p style={styles.subtitle}>This website contains adult content intended for viewers 18 years of age or older.</p>
        <p style={styles.label}>Enter your date of birth to continue</p>
        <input
          type="date"
          value={dob}
          onChange={e => { setDob(e.target.value); setError(''); }}
          style={styles.input}
          max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
        />
        {error && <p style={styles.error}>{error}</p>}
        <button onClick={handleConfirm} style={styles.btn}>I am 18 or older — Enter</button>
        <p style={styles.legal}>
          By entering, you confirm you are 18+ and agree to our{' '}
          <a href="/tos" style={styles.link}>Terms of Service</a> and{' '}
          <a href="/privacy" style={styles.link}>Privacy Policy</a>.
          This site uses cookies.
        </p>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: '#0a0a0a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: '20px', fontFamily: "'Syne', sans-serif"
  },
  card: {
    background: '#111', border: '1px solid #222', borderRadius: '20px',
    padding: '40px 32px', maxWidth: '420px', width: '100%', textAlign: 'center'
  },
  icon: { fontSize: '48px', marginBottom: '16px' },
  title: { color: '#fff', fontSize: '28px', fontWeight: 800, margin: '0 0 8px' },
  subtitle: { color: '#888', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' },
  label: { color: '#aaa', fontSize: '13px', margin: '0 0 10px' },
  input: {
    width: '100%', padding: '12px 16px', background: '#1a1a1a', border: '1px solid #333',
    borderRadius: '10px', color: '#fff', fontSize: '15px', marginBottom: '8px',
    boxSizing: 'border-box', outline: 'none'
  },
  error: { color: '#ff4757', fontSize: '13px', margin: '4px 0 12px' },
  btn: {
    width: '100%', padding: '14px', background: 'linear-gradient(135deg, #ff416c, #ff4b2b)',
    border: 'none', borderRadius: '12px', color: '#fff', fontSize: '16px',
    fontWeight: 700, cursor: 'pointer', marginTop: '12px', letterSpacing: '0.5px'
  },
  legal: { color: '#555', fontSize: '11px', marginTop: '20px', lineHeight: 1.6 },
  link: { color: '#ff416c', textDecoration: 'none' }
};
