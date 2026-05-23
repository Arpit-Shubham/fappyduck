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
  const [ageVerified, setAgeVerified] = useState(() => {
    return localStorage.getItem('age_verified') === 'true';
  });

  // Reset verification after 30 days
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
        <div style={{ fontFamily: "'Syne', sans-serif", background: '#000', minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/history" element={<History />} />
            <Route path="/liked" element={<Liked />} />
            <Route path="/account" element={<Account />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

function Splash() {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        width: '40px', height: '40px', border: '2px solid #1a1a1a',
        borderTop: '2px solid #ff416c', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
    </div>
  );
}
