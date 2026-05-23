// admin/src/App.jsx
import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

const style = document.createElement('style');
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080808; }
  @keyframes spin { to { transform: rotate(360deg); } }
  input, select, button { font-family: 'Syne', sans-serif; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0d0d0d; }
  ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
`;
document.head.appendChild(style);

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin_auth') === 'true');

  const logout = () => { sessionStorage.removeItem('admin_auth'); setAuthed(false); };

  return authed
    ? <Dashboard onLogout={logout} />
    : <Login onLogin={() => setAuthed(true)} />;
}
