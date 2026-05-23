// src/components/AuthPrompt.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Duck SVG
const DuckLogo = () => (
  <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
    <ellipse cx="20" cy="26" rx="13" ry="9" fill="rgba(26,107,255,0.15)" stroke="rgba(26,107,255,0.4)" strokeWidth="1"/>
    <circle cx="26" cy="15" r="8" fill="rgba(26,107,255,0.15)" stroke="rgba(26,107,255,0.4)" strokeWidth="1"/>
    <ellipse cx="33" cy="17" rx="5" ry="3" fill="rgba(26,107,255,0.1)" stroke="rgba(26,107,255,0.3)" strokeWidth="1"/>
    <circle cx="29" cy="13" r="1.5" fill="#1a6bff"/>
    <path d="M34 16.5c1.5 0 3 .5 3 1.5s-1.5 1-3 1" fill="#1a6bff" opacity="0.8"/>
  </svg>
);

export default function AuthPrompt({ icon, title, message }) {
  const navigate = useNavigate();
  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <DuckLogo />
        <div style={styles.iconBig}>{icon}</div>
        <h2 style={styles.title}>{title}</h2>
        <p style={styles.message}>{message}</p>
        <button onClick={() => navigate('/account')} style={styles.btn}>
          Sign In to Continue
        </button>
        <p style={styles.sub}>Don't have an account? Signing up is free.</p>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: 'calc(100vh - 68px)', background: '#050508',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px', fontFamily: "'Syne',sans-serif"
  },
  card: {
    background: 'rgba(26,107,255,0.05)',
    border: '1px solid rgba(26,107,255,0.15)',
    borderRadius: '24px', padding: '40px 28px',
    textAlign: 'center', maxWidth: '340px', width: '100%',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 0 60px rgba(26,107,255,0.08)'
  },
  iconBig: { fontSize: '48px', margin: '12px 0' },
  title: { color: '#fff', fontSize: '22px', fontWeight: 800, margin: '0 0 10px' },
  message: { color: '#666', fontSize: '14px', lineHeight: 1.6, margin: '0 0 28px' },
  btn: {
    width: '100%', padding: '14px',
    background: 'linear-gradient(135deg, #1a6bff, #0044cc)',
    border: 'none', borderRadius: '12px', color: '#fff',
    fontSize: '15px', fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(26,107,255,0.4)',
    fontFamily: "'Syne',sans-serif"
  },
  sub: { color: '#444', fontSize: '12px', marginTop: '14px' }
};
