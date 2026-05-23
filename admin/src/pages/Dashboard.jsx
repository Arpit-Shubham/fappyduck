// admin/src/pages/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getAllVideos, upsertVideo, deleteVideo, togglePublish, uploadThumbnail } from '../lib/supabase';

const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Other'];
const CATEGORIES = ['Amateur', 'Professional', 'Solo', 'Couple', 'Group', 'Fetish', 'LGBTQ+', 'Other'];

const emptyForm = {
  id: null, title: '', stream_url: '', thumbnail_url: '',
  language: 'English', category: 'Amateur', tags: '', published: false
};

export default function Dashboard({ onLogout }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState('');
  const [toast, setToast] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const fileRef = useRef();

  const load = async () => {
    setLoading(true);
    try { setVideos(await getAllVideos()); } catch (e) { showToast('Error loading: ' + e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleThumb = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { showToast('Title is required'); return; }
    if (!form.stream_url.trim()) { showToast('Stream URL is required'); return; }
    setSaving(true);
    try {
      let thumbnailUrl = form.thumbnail_url;
      if (thumbFile) thumbnailUrl = await uploadThumbnail(thumbFile);

      const payload = {
        ...(form.id ? { id: form.id } : {}),
        title: form.title.trim(),
        stream_url: form.stream_url.trim(),
        thumbnail_url: thumbnailUrl,
        language: form.language,
        category: form.category,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        published: form.published,
        view_count: form.view_count || 0,
        like_count: form.like_count || 0
      };

      await upsertVideo(payload);
      showToast(form.id ? '✓ Video updated' : '✓ Video uploaded');
      setForm(emptyForm); setThumbFile(null); setThumbPreview('');
      setEditMode(false);
      await load();
    } catch (e) { showToast('Error: ' + e.message); }
    setSaving(false);
  };

  const handleEdit = (v) => {
    setForm({
      id: v.id, title: v.title, stream_url: v.stream_url,
      thumbnail_url: v.thumbnail_url || '', language: v.language || 'English',
      category: v.category || 'Amateur',
      tags: Array.isArray(v.tags) ? v.tags.join(', ') : (v.tags || ''),
      published: v.published, view_count: v.view_count, like_count: v.like_count
    });
    setThumbPreview(v.thumbnail_url || '');
    setThumbFile(null);
    setEditMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    await deleteVideo(id);
    setConfirmDelete(null);
    showToast('🗑 Deleted');
    await load();
  };

  const handleTogglePublish = async (v) => {
    await togglePublish(v.id, v.published);
    showToast(v.published ? 'Unpublished' : '✓ Published');
    await load();
  };

  const filtered = videos.filter(v =>
    v.title?.toLowerCase().includes(search.toLowerCase()) ||
    v.language?.toLowerCase().includes(search.toLowerCase()) ||
    v.category?.toLowerCase().includes(search.toLowerCase())
  );

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div style={s.wrap}>
      {/* Toast */}
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.logo}>⚡</span>
          <span style={s.headerTitle}>StreamVault Admin</span>
        </div>
        <div style={s.headerRight}>
          <span style={s.stat}>{videos.length} videos</span>
          <span style={s.stat}>{videos.filter(v => v.published).length} live</span>
          <button onClick={onLogout} style={s.logoutBtn}>Logout</button>
        </div>
      </div>

      <div style={s.body}>
        {/* Upload / Edit Form */}
        <div style={s.formCard}>
          <h2 style={s.formTitle}>{editMode ? '✏️ Edit Video' : '➕ Upload New Video'}</h2>

          <div style={s.formGrid}>
            {/* Title */}
            <div style={s.field}>
              <label style={s.label}>Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="Enter video title..." style={s.input} />
            </div>

            {/* Stream URL */}
            <div style={s.field}>
              <label style={s.label}>Stream URL * <span style={s.hint}>(HLS .m3u8 or direct MP4)</span></label>
              <input value={form.stream_url} onChange={e => set('stream_url', e.target.value)}
                placeholder="https://cdn.example.com/video.m3u8" style={s.input} />
            </div>

            {/* Thumbnail */}
            <div style={s.field}>
              <label style={s.label}>Thumbnail</label>
              <div style={s.thumbRow}>
                {thumbPreview && (
                  <img src={thumbPreview} alt="thumb" style={s.thumbPreview} />
                )}
                <div style={s.thumbActions}>
                  <button onClick={() => fileRef.current.click()} style={s.thumbBtn}>
                    📁 Upload Image
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleThumb} style={{ display: 'none' }} />
                  <span style={s.or}>or</span>
                  <input value={form.thumbnail_url}
                    onChange={e => { set('thumbnail_url', e.target.value); setThumbPreview(e.target.value); setThumbFile(null); }}
                    placeholder="https://... (paste thumbnail URL)" style={{ ...s.input, marginBottom: 0 }} />
                </div>
              </div>
            </div>

            {/* Language + Category */}
            <div style={s.twoCol}>
              <div style={s.field}>
                <label style={s.label}>Language</label>
                <select value={form.language} onChange={e => set('language', e.target.value)} style={s.select}>
                  {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} style={s.select}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div style={s.field}>
              <label style={s.label}>Tags <span style={s.hint}>(comma separated)</span></label>
              <input value={form.tags} onChange={e => set('tags', e.target.value)}
                placeholder="amateur, blonde, solo..." style={s.input} />
            </div>

            {/* Published toggle */}
            <div style={s.publishRow}>
              <label style={s.label}>Published</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  onClick={() => set('published', !form.published)}
                  style={{ ...s.toggle, background: form.published ? '#ff416c' : '#2a2a2a' }}
                >
                  <div style={{ ...s.toggleKnob, transform: form.published ? 'translateX(22px)' : 'translateX(2px)' }} />
                </div>
                <span style={{ color: form.published ? '#ff416c' : '#555', fontSize: '13px' }}>
                  {form.published ? 'Visible to users' : 'Hidden (draft)'}
                </span>
              </div>
            </div>
          </div>

          <div style={s.formBtns}>
            {editMode && (
              <button onClick={() => { setForm(emptyForm); setEditMode(false); setThumbPreview(''); setThumbFile(null); }}
                style={s.cancelBtn}>Cancel</button>
            )}
            <button onClick={handleSave} disabled={saving} style={s.saveBtn}>
              {saving ? 'Saving...' : editMode ? 'Update Video' : 'Upload Video'}
            </button>
          </div>
        </div>

        {/* Video List */}
        <div style={s.listSection}>
          <div style={s.listHeader}>
            <h2 style={s.listTitle}>All Videos ({filtered.length})</h2>
            <input placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} style={s.search} />
          </div>

          {loading && <div style={s.center}><div style={s.spinner} /></div>}

          {!loading && filtered.length === 0 && (
            <p style={s.empty}>No videos yet. Upload one above!</p>
          )}

          <div style={s.videoList}>
            {filtered.map(v => (
              <div key={v.id} style={s.videoRow}>
                {/* Thumbnail */}
                <div style={s.rowThumb}>
                  {v.thumbnail_url
                    ? <img src={v.thumbnail_url} alt={v.title} style={s.rowThumbImg} />
                    : <div style={s.rowThumbPlaceholder}>▶</div>
                  }
                </div>

                {/* Info */}
                <div style={s.rowInfo}>
                  <p style={s.rowTitle}>{v.title}</p>
                  <p style={s.rowMeta}>{v.category} · {v.language}</p>
                  <p style={s.rowStats}>
                    👁 {(v.view_count || 0).toLocaleString()} &nbsp;
                    ❤️ {(v.like_count || 0).toLocaleString()} &nbsp;
                    📅 {new Date(v.created_at).toLocaleDateString()}
                  </p>
                  <p style={s.rowUrl} title={v.stream_url}>{v.stream_url?.substring(0, 50)}...</p>
                </div>

                {/* Actions */}
                <div style={s.rowActions}>
                  <button
                    onClick={() => handleTogglePublish(v)}
                    style={{ ...s.actionBtn, background: v.published ? '#1a3a1a' : '#3a1a1a', color: v.published ? '#4caf50' : '#ff4757' }}
                  >
                    {v.published ? '● Live' : '○ Draft'}
                  </button>
                  <button onClick={() => handleEdit(v)} style={{ ...s.actionBtn, background: '#1a2a3a', color: '#4a9eff' }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => setConfirmDelete(v.id)} style={{ ...s.actionBtn, background: '#2a1a1a', color: '#ff4757' }}>
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div style={s.modal} onClick={() => setConfirmDelete(null)}>
          <div style={s.modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>Delete Video?</h3>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>This cannot be undone.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmDelete(null)} style={s.cancelBtn}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ ...s.saveBtn, background: '#ff4757' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { minHeight: '100vh', background: '#080808', fontFamily: "'Syne', sans-serif", color: '#fff' },
  toast: {
    position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
    background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px',
    padding: '10px 20px', color: '#fff', fontSize: '14px', zIndex: 1000
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 24px', borderBottom: '1px solid #1a1a1a',
    background: '#0d0d0d', position: 'sticky', top: 0, zIndex: 10
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  logo: { fontSize: '24px' },
  headerTitle: { fontSize: '18px', fontWeight: 800, color: '#fff' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  stat: { color: '#666', fontSize: '13px' },
  logoutBtn: { padding: '7px 14px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#888', fontSize: '13px', cursor: 'pointer' },
  body: { maxWidth: '1100px', margin: '0 auto', padding: '30px 24px' },
  formCard: { background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '16px', padding: '28px', marginBottom: '32px' },
  formTitle: { fontSize: '18px', fontWeight: 800, margin: '0 0 24px', color: '#fff' },
  formGrid: { display: 'flex', flexDirection: 'column', gap: '18px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { color: '#aaa', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' },
  hint: { color: '#555', fontWeight: 400, textTransform: 'none', letterSpacing: 0 },
  input: { padding: '11px 14px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'inherit' },
  select: { padding: '11px 14px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'inherit' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  thumbRow: { display: 'flex', gap: '16px', alignItems: 'flex-start' },
  thumbPreview: { width: '100px', height: '140px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #2a2a2a', flexShrink: 0 },
  thumbActions: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  thumbBtn: { padding: '10px 16px', background: '#1a2a3a', border: '1px solid #2a3a4a', borderRadius: '8px', color: '#4a9eff', fontSize: '13px', cursor: 'pointer', alignSelf: 'flex-start' },
  or: { color: '#444', fontSize: '12px' },
  publishRow: { display: 'flex', flexDirection: 'column', gap: '8px' },
  toggle: { width: '46px', height: '26px', borderRadius: '13px', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 },
  toggleKnob: { position: 'absolute', top: '3px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'transform 0.2s' },
  formBtns: { display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' },
  cancelBtn: { padding: '11px 20px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#888', fontSize: '14px', cursor: 'pointer' },
  saveBtn: { padding: '11px 28px', background: 'linear-gradient(135deg, #ff416c, #ff4b2b)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' },
  listSection: {},
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px' },
  listTitle: { fontSize: '18px', fontWeight: 800, margin: 0 },
  search: { padding: '10px 14px', background: '#111', border: '1px solid #1e1e1e', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none', minWidth: '220px' },
  videoList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  videoRow: { background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '14px 16px', display: 'flex', gap: '14px', alignItems: 'center' },
  rowThumb: { width: '70px', height: '95px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#1a1a1a' },
  rowThumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  rowThumbPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '20px' },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: { color: '#fff', fontWeight: 700, fontSize: '15px', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  rowMeta: { color: '#ff416c', fontSize: '11px', fontWeight: 600, margin: '0 0 4px', letterSpacing: '0.5px' },
  rowStats: { color: '#555', fontSize: '12px', margin: '0 0 4px' },
  rowUrl: { color: '#333', fontSize: '11px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  rowActions: { display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 },
  actionBtn: { padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  center: { display: 'flex', justifyContent: 'center', padding: '40px 0' },
  spinner: { width: '28px', height: '28px', border: '2px solid #1a1a1a', borderTop: '2px solid #ff416c', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  empty: { color: '#444', textAlign: 'center', padding: '60px 0', fontSize: '15px' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalCard: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '32px 28px', textAlign: 'center' }
};
