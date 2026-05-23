// src/components/BottomNav.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/',        icon: '▶',  activeIcon: '▶',  label: 'Videos' },
  { path: '/history', icon: '🕐', activeIcon: '🕐', label: 'History' },
  { path: '/liked',   icon: '♡',  activeIcon: '❤️', label: 'Liked' },
  { path: '/account', icon: '○',  activeIcon: '●',  label: 'Account' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
        .bnav-tab { background: none; border: none; cursor: pointer; padding: 8px 0; flex: 1;
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          transition: transform 0.15s ease; }
        .bnav-tab:active { transform: scale(0.9); }
        .bnav-icon { font-size: 22px; line-height: 1; transition: all 0.2s ease; }
        .bnav-label { font-size: 10px; font-weight: 600; letter-spacing: 0.5px;
          transition: color 0.2s ease; font-family: 'Syne', sans-serif; }
        .bnav-tab.active .bnav-icon { filter: drop-shadow(0 0 8px #ff416c); transform: translateY(-2px); }
        .bnav-indicator { width: 4px; height: 4px; border-radius: 50%;
          background: linear-gradient(135deg, #ff416c, #ff4b2b);
          box-shadow: 0 0 8px #ff416c; margin-top: 2px;
          transition: opacity 0.2s ease; }
      `}</style>
      <nav style={styles.nav}>
        {/* Glass blur background */}
        <div style={styles.blur} />
        <div style={styles.inner}>
          {tabs.map(tab => {
            const active = pathname === tab.path;
            return (
              <button
                key={tab.path}
                className={`bnav-tab${active ? ' active' : ''}`}
                onClick={() => navigate(tab.path)}
              >
                <span className="bnav-icon">{active ? tab.activeIcon : tab.icon}</span>
                <span className="bnav-label" style={{ color: active ? '#ff416c' : '#666' }}>
                  {tab.label}
                </span>
                <div className="bnav-indicator" style={{ opacity: active ? 1 : 0 }} />
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

const styles = {
  nav: {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
    height: '68px', overflow: 'hidden'
  },
  blur: {
    position: 'absolute', inset: 0,
    background: 'rgba(8,8,8,0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderTop: '1px solid rgba(255,255,255,0.06)'
  },
  inner: {
    position: 'relative', display: 'flex', height: '100%',
    alignItems: 'center', paddingBottom: 'env(safe-area-inset-bottom, 0px)'
  }
};
