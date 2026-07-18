import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotes } from '../../hooks/useNotes';
import { useNavigate, useParams } from '../../hooks/useNavigation.js';
import { getTheme, setTheme } from '../../utils/storage';
import {
  FiHome, FiFileText, FiBookmark, FiHeart, FiArchive,
  FiTrash2, FiSun, FiMoon, FiLogOut, FiPlus, FiStar, FiCheckSquare,
} from 'react-icons/fi';

import ProfileModal from './ProfileModal';
import DeletedNotesModal from './DeletedNotesModal';
import AllNotesPage from './AllNotesPage';
import PinnedNotesPage from './PinnedNotesPage';
import FavoriteNotesPage from './FavoriteNotesPage';
import ArchivedNotesPage from './ArchivedNotesPage';

import {
  initials,
  getIsPinned,
  getIsFavorite,
  getIsArchived,
  getIsDeleted,
  stripHtml,
  fmtDate,
} from '../../utils/dashboardUtils.js';

import '../styles/dashboard.css';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: <FiHome size={15} /> },
  { id: 'all', label: 'All Notes', icon: <FiFileText size={15} /> },
  { id: 'pinned', label: 'Pinned', icon: <FiBookmark size={15} /> },
  { id: 'favorites', label: 'Favorites', icon: <FiHeart size={15} /> },
  { id: 'archived', label: 'Archived', icon: <FiArchive size={15} /> },
];

const Dashboard = ({ onLogout }) => {
  const { user, updateTheme } = useAuth();
  const { allNotes: rawAllNotes, fetchAllNotes, createNote } = useNotes();
  const navigate = useNavigate();
  const params = useParams();

  const [currentTheme, setCurrentThemeState] = useState(getTheme());
  const navTab = params.tab || 'home'; 
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const newMenuRef = useRef(null);

  const allNotes = useMemo(() => rawAllNotes ?? [], [rawAllNotes, refreshTrigger]);

  const refreshAll = useCallback(() => {
    fetchAllNotes();
    setRefreshTrigger(prev => prev + 1);
  }, [fetchAllNotes]);

  useEffect(() => {
    fetchAllNotes();
  }, [fetchAllNotes]);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', currentTheme === 'dark');
  }, [currentTheme]);



  useEffect(() => {
    const handler = (e) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target)) setShowNewMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggleTheme = async () => {
    const t = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentThemeState(t);
    setTheme(t);
    try { await updateTheme(t); } catch (e) { console.error(e); }
  };

  const handleCreateNote = async (type = 'note') => {
    setShowNewMenu(false);
    try {
      const initialContent = type === 'todo'
        ? JSON.stringify(Array.from({ length: 5 }, () => ({ text: '', done: false })))
        : '';
      await createNote('Untitled', initialContent, type);
      navigate('dashboard', { tab: 'all' });
      refreshAll();
    } catch (e) { console.error(e); }
  };

  const countFor = useCallback((tab) => {
    if (!allNotes.length) return 0;
    return allNotes.filter(n => {
      if (getIsDeleted(n)) return false;
      const archived = getIsArchived(n);
      if (tab === 'all') return !archived;
      if (tab === 'pinned') return getIsPinned(n) && !archived;
      if (tab === 'favorites') return getIsFavorite(n) && !archived;
      if (tab === 'archived') return archived;
      return false;
    }).length;
  }, [allNotes]);
  
const handleNavClick = (id) => {
  navigate('dashboard', { tab: id });
};

  const renderPage = () => {
    const props = { refreshAll };
    switch (navTab) {
      case 'all':       return <AllNotesPage {...props} />;
      case 'pinned':    return <PinnedNotesPage {...props} />;
      case 'favorites': return <FavoriteNotesPage {...props} />;
      case 'archived':  return <ArchivedNotesPage {...props} />;
      default:          return null;
    }
  };

  const avatarSrc = user?.avatar || user?.avatar_url || user?.avatarUrl || '';

  return (
    <div className="db-root">
      {/* SIDEBAR */}
      <aside className="db-sidebar">
        <div className="db-brand">
          <FiStar size={18} color="var(--gold)" />
          <span className="db-brand-name">NoteSphere</span>
        </div>

        <nav className="db-nav">
          <div className="db-nav-section">Navigate</div>
          {NAV_ITEMS.map(item => {
            const cnt = item.id === 'home' ? null : countFor(item.id);
            return (
              <button
                key={item.id}
                className={`db-nav-item${navTab === item.id ? ' active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="db-nav-item-icon">{item.icon}</span>
                {item.label}
                {cnt !== null && <span className="db-nav-item-count">{cnt}</span>}
              </button>
            );
          })}

          <div className="db-nav-section">More</div>
          <button className="db-nav-item" onClick={() => setShowDeletedModal(true)}>
            <span className="db-nav-item-icon"><FiTrash2 size={15} /></span>
            Trash
          </button>
        </nav>

        <div className="db-sidebar-footer">
          <button className="db-user-row" onClick={() => setShowProfileModal(true)}>
            <div className="db-avatar">
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                initials(user?.username || user?.email)
              )}
            </div>
            <div className="db-user-info">
              <span className="db-user-name">{user?.username || 'You'}</span>
            </div>
          </button>

          <button className="db-footer-btn" onClick={handleToggleTheme}>
            <span className="db-footer-btn-icon">
              {currentTheme === 'dark' ? <FiSun size={14} /> : <FiMoon size={14} />}
            </span>
            {currentTheme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>

          <button className="db-footer-btn danger" onClick={() => setShowLogoutConfirm(true)}>
            <span className="db-footer-btn-icon"><FiLogOut size={14} /></span>
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="db-main">
        {navTab === 'home' ? (
          <HomeViewInternal
            user={user}
            allNotes={allNotes}
            countFor={countFor}
            onNavigate={handleNavClick}
            onCreateNote={handleCreateNote}
            newMenuRef={newMenuRef}
            showNewMenu={showNewMenu}
            setShowNewMenu={setShowNewMenu}
          />
        ) : (
          renderPage()
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="db-modal-overlay">
          <div className="db-modal db-confirm-modal">
            <div className="db-confirm-icon" style={{ color: 'var(--gold)' }}><FiLogOut size={32} /></div>
            <h3 className="db-confirm-title">Sign out?</h3>
            <p className="db-confirm-body">You'll need to sign in again to access your notes.</p>
            <div className="db-confirm-actions">
              <button className="db-confirm-cancel" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button 
                className="db-confirm-delete" 
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout?.();
                }}
                style={{ background: 'var(--gold)', color: '#0f0e0c' }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
      {showDeletedModal && (
        <DeletedNotesModal
          onClose={() => setShowDeletedModal(false)}
          onRestore={() => { setShowDeletedModal(false); refreshAll(); }}
        />
      )}
    </div>
  );
};

/* ==================== HOME VIEW ==================== */
const HomeViewInternal = ({
  user, allNotes, countFor, onNavigate, onCreateNote,
  newMenuRef, showNewMenu, setShowNewMenu
}) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = user?.username || 'there';

  const recentNotes = [...(allNotes ?? [])]
    .filter(n => !getIsArchived(n) && !getIsDeleted(n))
    .sort((a, b) => new Date(b.updated_at ?? b.updatedAt ?? 0) - new Date(a.updated_at ?? a.updatedAt ?? 0))
    .slice(0, 4);

  const SECTIONS = [
    { id: 'all', label: 'All Notes', icon: <FiFileText size={20} />, color: '#d4aa64' },
    { id: 'pinned', label: 'Pinned', icon: <FiBookmark size={20} />, color: '#a78bfa' },
    { id: 'favorites', label: 'Favorites', icon: <FiHeart size={20} />, color: '#f87171' },
    { id: 'archived', label: 'Archived', icon: <FiArchive size={20} />, color: '#6b7280' },
  ];

  return (
    <>
      <div className="db-topbar">
        <span className="db-topbar-title">Home</span>
        <div className="db-new-wrap" ref={newMenuRef}>
          <button className="db-new-btn" onClick={() => setShowNewMenu(v => !v)}>
            <FiPlus size={14} /> New <span className="db-new-caret">▾</span>
          </button>
          {showNewMenu && (
            <div className="db-new-menu">
              <button className="db-new-menu-item" onClick={() => onCreateNote('note')}>
                <span className="db-new-menu-icon"><FiFileText size={18} /></span>
                <span><strong>Note</strong><span className="db-new-menu-sub">Rich text, formatted</span></span>
              </button>
              <button className="db-new-menu-item" onClick={() => onCreateNote('todo')}>
                <span className="db-new-menu-icon"><FiCheckSquare size={18} /></span>
                <span><strong>To-Do List</strong><span className="db-new-menu-sub">Checklist with progress</span></span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="db-body">
        <div className="db-notes-pane">
          <div className="db-home">
            <div className="db-home-greeting">
              <h1>{greeting}, <em>{name}.</em></h1>
              <p>What would you like to capture today?</p>
            </div>

            <div className="db-home-create">
              <button className="db-home-create-card" onClick={() => onCreateNote('note')}>
                <span className="db-home-create-icon"><FiFileText size={22} /></span>
                <strong>New Note</strong>
                <span>Rich text, formatted</span>
              </button>
              <button className="db-home-create-card" onClick={() => onCreateNote('todo')}>
                <span className="db-home-create-icon"><FiCheckSquare size={22} /></span>
                <strong>New To-Do</strong>
                <span>Checklist with progress</span>
              </button>
            </div>

            <div className="db-home-stats">
              {SECTIONS.map(s => (
                <button key={s.id} className="db-home-stat" onClick={() => onNavigate(s.id)}>
                  <span className="db-home-stat-icon" style={{ color: s.color }}>{s.icon}</span>
                  <span className="db-home-stat-count">{countFor(s.id)}</span>
                  <span className="db-home-stat-label">{s.label}</span>
                </button>
              ))}
            </div>

            {recentNotes.length > 0 && (
              <>
                <div className="db-section-label" style={{ marginTop: 36 }}>Recently edited</div>
                <div className="db-grid" style={{ marginTop: 14 }}>
                  {recentNotes.map((note, i) => (
                    <div key={note.id} className="db-card" 
                         style={{ animationDelay: `${i * 40}ms`, cursor: 'pointer' }}
                         onClick={() => onNavigate('all')}>
                      <div className="db-card-title">{note.title || 'Untitled'}</div>
                      <div className="db-card-preview">
                        {note.type === 'todo' 
                          ? (() => {
                              try {
                                const items = JSON.parse(note.content || '[]');
                                const done = items.filter(t => t.done).length;
                                return `${done}/${items.length} tasks done`;
                              } catch { return ''; }
                            })()
                          : stripHtml(note.content || '')
                        }
                      </div>
                      <div className="db-card-meta">
                        <span className="db-card-date">
                          {fmtDate(note.updated_at || note.updatedAt || note.created_at || note.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;