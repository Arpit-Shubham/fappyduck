// admin/src/pages/Login.jsx
import React, { useState } from 'react';

// ⚠️ Change these credentials — store in .env as REACT_APP_ADMIN_USER and REACT_APP_ADMIN_PASS
const ADMIN_USER = process.env.REACT_APP_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.REACT_APP_ADMIN_PASS || 'changeme123';

export default function Login({ onLogin }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');

  const handle = () => {
    if (u === ADMIN_USER && p === ADMIN_PASS) {
      sessionStorage.setItem('admin_auth', 'true');
      onLogin();
    } else setErr('Invalid credentials');
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.logo}>⚡</div>
        <h1 style={styles.title}>Admin Panel</h1>
        <p style={styles.sub}>StreamVault Management</p>
        <input placeholder="Username" value={u} onChange={e => setU(e.target.value)} style={styles.input} />
        <input placeholder="Password" type="password" value={p} onChange={e => setP(e.target.value)}
          style={styles.input} onKeyDown={e => e.key === 'Enter' && handle()} />
        {err && <p style={styles.err}>{err}</p>}
        <button onClick={handle} style={styles.btn}>Sign In</button>
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: { background: '#111', border: '1px solid #1e1e1e', borderRadius: '16px', padding: '40px 32px', width: '360px', textAlign: 'center' },
  logo: { fontSize: '40px', marginBottom: '12px' },
  title: { color: '#fff', fontSize: '24px', fontWeight: 800, margin: '0 0 6px' },
  sub: { color: '#555', fontSize: '14px', margin: '0 0 28px' },
  input: { width: '100%', padding: '12px 14px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '14px', marginBottom: '10px', boxSizing: 'border-box', outline: 'none' },
  err: { color: '#ff4757', fontSize: '13px', margin: '4px 0 10px' },
  btn: { width: '100%', padding: '13px', background: 'linear-gradient(135deg, #ff416c, #ff4b2b)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }
};
