// src/components/BottomNav.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// SVG icons - clean, standard, Instagram/YouTube style
const Icons = {
  videos: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="13" height="16" rx="2" fill={active ? '#1a6bff' : 'none'} stroke={active ? '#1a6bff' : '#aaa'} strokeWidth="1.8"/>
      <path d="M15 9l5-3v12l-5-3V9z" fill={active ? '#1a6bff' : 'none'} stroke={active ? '#1a6bff' : '#aaa'} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  ),
  history: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={active ? '#1a6bff' : '#aaa'} strokeWidth="1.8"/>
      <path d="M12 7v5l3 3" stroke={active ? '#1a6bff' : '#aaa'} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M5.5 5.5L3 3M5.5 5.5A9 9 0 003 12h2" stroke={active ? '#1a6bff' : '#aaa'} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  liked: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 21C12 21 3 15.5 3 9a5 5 0 019-3 5 5 0 019 3c0 6.5-9 12-9 12z"
        fill={active ? '#1a6bff' : 'none'} stroke={active ? '#1a6bff' : '#aaa'} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  ),
  account: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" fill={active ? '#1a6bff' : 'none'} stroke={active ? '#1a6bff' : '#aaa'} strokeWidth="1.8"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={active ? '#1a6bff' : '#aaa'} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
};

const tabs = [
  { path: '/',        key: 'videos',   label: 'Videos'  },
  { path: '/history', key: 'history',  label: 'History' },
  { path: '/liked',   key: 'liked',    label: 'Liked'   },
  { path: '/account', key: 'account',  label: 'Account' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
        .bnav-tab {
          background: none; border: none; cursor: pointer; padding: 8px 0; flex: 1;
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          transition: transform 0.15s ease; -webkit-tap-highlight-color: transparent;
        }
        .bnav-tab:active { transform: scale(0.88); }
        .bnav-icon-wrap { transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; }
        .bnav-tab.active .bnav-icon-wrap {
          filter: drop-shadow(0 0 8px rgba(26,107,255,0.7));
          transform: translateY(-2px);
        }
        .bnav-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.4px;
          transition: color 0.2s ease; font-family: 'Syne', sans-serif;
        }
        .bnav-dot {
          width: 4px; height: 4px; border-radius: 50%;
          background: #1a6bff;
          box-shadow: 0 0 8px #1a6bff, 0 0 16px rgba(26,107,255,0.5);
          transition: opacity 0.2s ease;
        }
      `}</style>
      <nav style={styles.nav}>
        <div style={styles.blur} />
        <div style={styles.topLine} />
        <div style={styles.inner}>
          {tabs.map(tab => {
            const active = pathname === tab.path;
            return (
              <button key={tab.path} className={`bnav-tab${active ? ' active' : ''}`}
                onClick={() => navigate(tab.path)}>
                <div className="bnav-icon-wrap">{Icons[tab.key](active)}</div>
                <span className="bnav-label" style={{ color: active ? '#1a6bff' : '#777' }}>
                  {tab.label}
                </span>
                <div className="bnav-dot" style={{ opacity: active ? 1 : 0 }} />
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

const styles = {
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, height: '68px', overflow: 'hidden' },
  blur: {
    position: 'absolute', inset: 0,
    background: 'rgba(5,5,10,0.92)',
    backdropFilter: 'blur(24px) saturate(200%)',
    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
  },
  topLine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(26,107,255,0.3), rgba(26,107,255,0.6), rgba(26,107,255,0.3), transparent)'
  },
  inner: {
    position: 'relative', display: 'flex', height: '100%',
    alignItems: 'center', paddingBottom: 'env(safe-area-inset-bottom, 0px)'
  }
};
