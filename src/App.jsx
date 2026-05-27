// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, useAuthProvider } from './hooks/useAuth';
import AgeGate from './components/AgeGate';
import BottomNav from './components/BottomNav';
import Feed from './pages/Feed';
import History from './pages/History';
import Liked from './pages/Liked';
import Account from './pages/Account';

export default function App() {
  const auth = useAuthProvider();
  const [ageVerified, setAgeVerified] = useState(() =>
    localStorage.getItem('age_verified') === 'true'
  );

  useEffect(() => {
    const verifiedAt = localStorage.getItem('age_verified_at');
    if (verifiedAt && Date.now() - parseInt(verifiedAt) > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem('age_verified');
      localStorage.removeItem('age_verified_at');
      setAgeVerified(false);
    }
  }, []);

  if (auth.loading) return <Splash />;
  if (!ageVerified) return <AgeGate onConfirm={() => setAgeVerified(true)} />;

  return (
    <AuthContext.Provider value={auth}>
      <BrowserRouter>
        <div style={{ fontFamily: "'Syne', sans-serif", background: '#050508', minHeight: '100vh' }}>
          <Routes>
            {/* Main feed — optional video ID param for direct links */}
            <Route path="/"       element={<Feed />} />
            <Route path="/v/:id"  element={<Feed />} />
            <Route path="/history" element={<History />} />
            <Route path="/liked"   element={<Liked />} />
            <Route path="/account" element={<Account />} />
            <Route path="*"        element={<Navigate to="/" />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

function Splash() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#050508', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
        <ellipse cx="20" cy="27" rx="13" ry="9" fill="#fff" opacity="0.9"/>
        <circle cx="26" cy="16" r="8" fill="#fff" opacity="0.9"/>
        <circle cx="29" cy="13" r="1.5" fill="#111"/>
        <path d="M34 16.5c1.5 0 3 .5 3 1.5s-1.5 1-3 1" fill="#f5c842"/>
      </svg>
      <div style={{ width: '36px', height: '36px', border: '2px solid rgba(26,107,255,0.15)', borderTop: '2px solid #1a6bff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}
