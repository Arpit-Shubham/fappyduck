// src/components/AgeGate.jsx
import React, { useState } from 'react';

const DuckSVG = () => (
  <svg width="60" height="60" viewBox="0 0 40 40" fill="none">
    <ellipse cx="20" cy="27" rx="14" ry="9" fill="#fff" opacity="0.9"/>
    <circle cx="26" cy="16" r="9" fill="#fff" opacity="0.9"/>
    <ellipse cx="34" cy="18" rx="5.5" ry="3" fill="#e0e0e0" opacity="0.9"/>
    <circle cx="29" cy="13" r="1.8" fill="#111"/>
    <path d="M35 17.5c1.8 0 3.5.6 3.5 1.8s-1.7 1.2-3.5 1.2" fill="#f5c842" opacity="0.9"/>
  </svg>
);

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
      <div style={styles.bgGlow} />
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <DuckSVG />
          <span style={styles.brand}>FappyDuck</span>
        </div>
        <div style={styles.badge}>18+</div>
        <h1 style={styles.title}>Adults Only</h1>
        <p style={styles.subtitle}>This website contains adult content for viewers 18 years or older.</p>
        <p style={styles.label}>Enter your date of birth</p>
        <input type="date" value={dob} onChange={e => { setDob(e.target.value); setError(''); }}
          style={styles.input}
          max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} />
        {error && <p style={styles.error}>{error}</p>}
        <button onClick={handleConfirm} style={styles.btn}>Enter FappyDuck</button>
        <p style={styles.legal}>
          By entering you confirm you are 18+ and agree to our{' '}
          <a href="/tos" style={styles.link}>Terms</a> &amp;{' '}
          <a href="/privacy" style={styles.link}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: '#050508',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: '20px', fontFamily: "'Syne', sans-serif", overflow: 'hidden'
  },
  bgGlow: {
    position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
    width: '400px', height: '400px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(26,107,255,0.12) 0%, transparent 70%)',
    pointerEvents: 'none'
  },
  card: {
    background: 'rgba(8,12,28,0.9)',
    border: '1px solid rgba(26,107,255,0.2)',
    borderRadius: '24px', padding: '40px 28px',
    maxWidth: '420px', width: '100%', textAlign: 'center',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 0 80px rgba(26,107,255,0.1)',
    position: 'relative'
  },
  logoRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' },
  brand: { color: '#fff', fontSize: '24px', fontWeight: 800, letterSpacing: '0.5px' },
  badge: {
    display: 'inline-block',
    background: 'rgba(26,107,255,0.15)',
    border: '1px solid rgba(26,107,255,0.4)',
    color: '#1a6bff', fontSize: '13px', fontWeight: 800,
    padding: '3px 12px', borderRadius: '20px', marginBottom: '12px',
    letterSpacing: '1px'
  },
  title: { color: '#fff', fontSize: '26px', fontWeight: 800, margin: '0 0 8px' },
  subtitle: { color: '#666', fontSize: '13px', lineHeight: 1.6, margin: '0 0 24px' },
  label: { color: '#888', fontSize: '12px', margin: '0 0 8px', fontWeight: 600, letterSpacing: '0.5px' },
  input: {
    width: '100%', padding: '13px 16px',
    background: 'rgba(26,107,255,0.06)',
    border: '1px solid rgba(26,107,255,0.2)',
    borderRadius: '12px', color: '#fff', fontSize: '15px',
    marginBottom: '8px', boxSizing: 'border-box', outline: 'none',
    colorScheme: 'dark'
  },
  error: { color: '#ff4757', fontSize: '13px', margin: '4px 0 12px' },
  btn: {
    width: '100%', padding: '14px',
    background: 'linear-gradient(135deg, #1a6bff, #0044cc)',
    border: 'none', borderRadius: '12px', color: '#fff',
    fontSize: '16px', fontWeight: 700, cursor: 'pointer', marginTop: '8px',
    boxShadow: '0 4px 24px rgba(26,107,255,0.4)',
    letterSpacing: '0.3px', fontFamily: "'Syne',sans-serif"
  },
  legal: { color: '#444', fontSize: '11px', marginTop: '18px', lineHeight: 1.7 },
  link: { color: '#1a6bff', textDecoration: 'none' }
};
