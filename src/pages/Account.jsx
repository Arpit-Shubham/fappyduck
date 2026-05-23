// src/pages/Account.jsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const DuckSVG = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
    <ellipse cx="20" cy="27" rx="13" ry="9" fill="#fff" opacity="0.9"/>
    <circle cx="26" cy="16" r="8" fill="#fff" opacity="0.9"/>
    <ellipse cx="33" cy="18" rx="5" ry="3" fill="#ddd" opacity="0.9"/>
    <circle cx="29" cy="13" r="1.5" fill="#111"/>
    <path d="M34 16.5c1.5 0 3 .5 3 1.5s-1.5 1-3 1" fill="#f5c842"/>
  </svg>
);

export default function Account() {
  const { user, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setError(''); setLoading(true);
    try {
      if (mode === 'login') await signIn(email, password);
      else await signUp(email, password, username);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  if (user) return (
    <div style={styles.wrap}>
      <div style={styles.profileCard}>
        <div style={styles.avatar}>{user.email?.[0]?.toUpperCase()}</div>
        <p style={styles.email}>{user.email}</p>
        <p style={styles.uid}>Member since {new Date(user.created_at || Date.now()).getFullYear()}</p>
        <div style={styles.divider} />
        <button onClick={signOut} style={styles.signOutBtn}>Sign Out</button>
      </div>
    </div>
  );

  return (
    <div style={styles.wrap}>
      <div style={styles.bgGlow} />
      <div style={styles.formCard}>
        <div style={styles.brandRow}>
          <DuckSVG />
          <span style={styles.brandText}>FappyDuck</span>
        </div>
        <h2 style={styles.heading}>{mode === 'login' ? 'Welcome Back' : 'Join FappyDuck'}</h2>
        <p style={styles.sub}>{mode === 'login' ? 'Sign in to your account' : 'Create your free account'}</p>

        {mode === 'signup' && (
          <input placeholder="Username" value={username}
            onChange={e => setUsername(e.target.value)} style={styles.input} />
        )}
        <input placeholder="Email address" type="email" value={email}
          onChange={e => setEmail(e.target.value)} style={styles.input} />
        <input placeholder="Password" type="password" value={password}
          onChange={e => setPassword(e.target.value)} style={styles.input}
          onKeyDown={e => e.key === 'Enter' && handle()} />

        {error && <p style={styles.error}>{error}</p>}

        <button onClick={handle} disabled={loading} style={styles.btn}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        <button onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')} style={styles.toggle}>
          {mode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: 'calc(100vh - 68px)', background: '#050508',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '40px 24px',
    fontFamily: "'Syne', sans-serif", position: 'relative', overflow: 'hidden'
  },
  bgGlow: {
    position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
    width: '350px', height: '350px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(26,107,255,0.1) 0%, transparent 70%)',
    pointerEvents: 'none'
  },
  formCard: {
    background: 'rgba(8,12,28,0.8)', border: '1px solid rgba(26,107,255,0.15)',
    borderRadius: '24px', padding: '36px 28px',
    maxWidth: '380px', width: '100%', backdropFilter: 'blur(20px)',
    boxShadow: '0 0 60px rgba(26,107,255,0.08)', position: 'relative'
  },
  profileCard: {
    background: 'rgba(8,12,28,0.8)', border: '1px solid rgba(26,107,255,0.15)',
    borderRadius: '24px', padding: '40px 28px',
    maxWidth: '380px', width: '100%', backdropFilter: 'blur(20px)',
    textAlign: 'center'
  },
  brandRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' },
  brandText: { color: '#fff', fontSize: '20px', fontWeight: 800 },
  avatar: {
    width: '80px', height: '80px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #1a6bff, #0044cc)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '32px', color: '#fff', fontWeight: 800,
    margin: '0 auto 16px', boxShadow: '0 0 30px rgba(26,107,255,0.4)'
  },
  email: { color: '#fff', fontSize: '18px', fontWeight: 700, margin: '0 0 6px' },
  uid: { color: '#555', fontSize: '13px', margin: 0 },
  divider: { height: '1px', background: 'rgba(26,107,255,0.1)', margin: '24px 0' },
  heading: { color: '#fff', fontSize: '24px', fontWeight: 800, margin: '0 0 6px' },
  sub: { color: '#555', fontSize: '13px', margin: '0 0 24px' },
  input: {
    width: '100%', padding: '13px 16px',
    background: 'rgba(26,107,255,0.06)',
    border: '1px solid rgba(26,107,255,0.15)',
    borderRadius: '12px', color: '#fff', fontSize: '14px',
    marginBottom: '10px', boxSizing: 'border-box', outline: 'none',
    fontFamily: 'inherit', colorScheme: 'dark'
  },
  error: { color: '#ff4757', fontSize: '13px', margin: '0 0 10px' },
  btn: {
    width: '100%', padding: '14px',
    background: 'linear-gradient(135deg, #1a6bff, #0044cc)',
    border: 'none', borderRadius: '12px', color: '#fff',
    fontSize: '15px', fontWeight: 700, cursor: 'pointer', marginTop: '4px',
    fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(26,107,255,0.3)'
  },
  toggle: {
    background: 'none', border: 'none', color: '#1a6bff',
    fontSize: '13px', cursor: 'pointer', marginTop: '16px',
    fontFamily: 'inherit', width: '100%', textAlign: 'center'
  },
  signOutBtn: {
    padding: '12px 32px',
    background: 'rgba(26,107,255,0.08)',
    border: '1px solid rgba(26,107,255,0.2)',
    borderRadius: '12px', color: '#1a6bff', fontSize: '15px',
    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
  }
};
