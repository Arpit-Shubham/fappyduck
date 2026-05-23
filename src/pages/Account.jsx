// src/pages/Account.jsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Account() {
  const { user, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState('login'); // login | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');

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
      <div style={styles.avatar}>{user.email?.[0]?.toUpperCase()}</div>
      <p style={styles.email}>{user.email}</p>
      <p style={styles.uid}>UID: {user.id.slice(0, 8)}...</p>
      <button onClick={signOut} style={styles.signOutBtn}>Sign Out</button>
    </div>
  );

  return (
    <div style={styles.wrap}>
      <h2 style={styles.heading}>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
      <p style={styles.sub}>{mode === 'login' ? 'Sign in to your account' : 'Join to save history & likes'}</p>

      {mode === 'signup' && (
        <input placeholder="Username" value={username}
          onChange={e => setUsername(e.target.value)} style={styles.input} />
      )}
      <input placeholder="Email" type="email" value={email}
        onChange={e => setEmail(e.target.value)} style={styles.input} />
      <input placeholder="Password" type="password" value={password}
        onChange={e => setPassword(e.target.value)} style={styles.input} />

      {error && <p style={styles.error}>{error}</p>}

      <button onClick={handle} disabled={loading} style={styles.btn}>
        {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
      </button>

      <button onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')} style={styles.toggle}>
        {mode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
      </button>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: 'calc(100vh - 68px)', background: '#0a0a0a',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '40px 24px',
    fontFamily: "'Syne', sans-serif"
  },
  avatar: {
    width: '80px', height: '80px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #ff416c, #ff4b2b)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '32px', color: '#fff', fontWeight: 800, marginBottom: '20px'
  },
  email: { color: '#fff', fontSize: '18px', fontWeight: 700, margin: '0 0 6px' },
  uid: { color: '#555', fontSize: '12px', margin: '0 0 30px' },
  heading: { color: '#fff', fontSize: '28px', fontWeight: 800, margin: '0 0 8px', textAlign: 'center' },
  sub: { color: '#666', fontSize: '14px', margin: '0 0 32px', textAlign: 'center' },
  input: {
    width: '100%', maxWidth: '360px', padding: '14px 16px',
    background: '#111', border: '1px solid #222', borderRadius: '12px',
    color: '#fff', fontSize: '15px', marginBottom: '12px',
    boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit'
  },
  error: { color: '#ff4757', fontSize: '13px', margin: '0 0 12px', textAlign: 'center' },
  btn: {
    width: '100%', maxWidth: '360px', padding: '14px',
    background: 'linear-gradient(135deg, #ff416c, #ff4b2b)',
    border: 'none', borderRadius: '12px', color: '#fff',
    fontSize: '16px', fontWeight: 700, cursor: 'pointer', marginTop: '4px'
  },
  toggle: {
    background: 'none', border: 'none', color: '#ff416c',
    fontSize: '14px', cursor: 'pointer', marginTop: '20px'
  },
  signOutBtn: {
    padding: '12px 32px', background: '#1a1a1a', border: '1px solid #333',
    borderRadius: '12px', color: '#ff416c', fontSize: '15px',
    fontWeight: 600, cursor: 'pointer'
  }
};
