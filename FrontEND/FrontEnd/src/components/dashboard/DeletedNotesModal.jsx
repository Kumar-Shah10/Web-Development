import { useState, useEffect } from 'react';
import { useNotes } from '../../hooks/useNotes';
import {
  FiTrash2, FiX, FiRotateCcw, FiCheckSquare, FiInbox,
} from 'react-icons/fi';
import '../styles/deleted-modal.css';

const DeletedNotesModal = ({ onClose, onRestore }) => {
  const [deletedNotes,  setDeletedNotes]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [confirmId,     setConfirmId]     = useState(null);   // single permanent-delete confirm
  const [confirmAll,    setConfirmAll]    = useState(false);  // delete-all confirm
  const [restoringId,   setRestoringId]   = useState(null);
  const [deletingId,    setDeletingId]    = useState(null);
  const [deletingAll,   setDeletingAll]   = useState(false);

  const { fetchDeletedNotes, restoreNote, permanentlyDeleteNote } = useNotes();

  /* ── load ── */
  useEffect(() => {
    const load = async () => {
      try {
        const notes = await fetchDeletedNotes();
        setDeletedNotes(notes ?? []);
      } catch (err) {
        console.error('Failed to load deleted notes:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchDeletedNotes]);

  /* ── restore single ── */
  const handleRestore = async (id) => {
    setRestoringId(id);
    try {
      await restoreNote(id);
      setDeletedNotes(prev => prev.filter(n => n.id !== id));
      onRestore(id);
    } catch (err) {
      console.error('Failed to restore note:', err);
    } finally {
      setRestoringId(null);
    }
  };

  /* ── permanent delete single ── */
  const handlePermanentDelete = async (id) => {
    setDeletingId(id);
    try {
      await permanentlyDeleteNote(id);
      setDeletedNotes(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to permanently delete note:', err);
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  /* ── delete ALL permanently ── */
  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      for (const note of deletedNotes) {
        await permanentlyDeleteNote(note.id);
      }
      setDeletedNotes([]);
    } catch (err) {
      console.error('Failed to delete all notes:', err);
      try {
        const notes = await fetchDeletedNotes();
        setDeletedNotes(notes ?? []);
      } catch { /* ignore */ }
    } finally {
      setDeletingAll(false);
      setConfirmAll(false);
    }
  };

  const stripHtml = (html = '') => html.replace(/<[^>]*>/g, '');

  const preview = (note) => {
    if (note.type === 'todo') {
      try {
        const items = JSON.parse(note.content || '[]');
        const done  = items.filter(t => t.done).length;
        return `${done} / ${items.length} tasks done`;
      } catch { return ''; }
    }
    return stripHtml(note.content || '');
  };

  return (
    <div className="dn-overlay" onClick={onClose}>
      <div className="dn-panel" onClick={e => e.stopPropagation()}>

        {/* ── header ── */}
        <div className="dn-header">
          <div className="dn-header-left">
            <span className="dn-header-icon"><FiTrash2 size={18} /></span>
            <div>
              <h2 className="dn-title">Trash</h2>
              <p className="dn-subtitle">
                {loading
                  ? 'Loading…'
                  : `${deletedNotes.length} deleted note${deletedNotes.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <button className="dn-close" onClick={onClose} title="Close">
            <FiX size={14} />
          </button>
        </div>

        {/* ── body ── */}
        <div className="dn-body">

          {loading && (
            <div className="dn-loading">
              <span className="dn-dot" /><span className="dn-dot" /><span className="dn-dot" />
            </div>
          )}

          {!loading && deletedNotes.length === 0 && (
            <div className="dn-empty">
              <div className="dn-empty-icon"><FiInbox size={32} /></div>
              <h3>Trash is empty</h3>
              <p>Deleted notes will appear here. You can restore or permanently remove them.</p>
            </div>
          )}

          {!loading && deletedNotes.length > 0 && (
            <div className="dn-list">
              {deletedNotes.map((note, i) => (
                <div
                  key={note.id}
                  className="dn-item"
                  style={{ animationDelay: `${i * 35}ms` }}
                >
                  {note.color && note.color !== '#FFFFFF' && (
                    <div className="dn-item-accent" style={{ background: note.color }} />
                  )}

                  <div className="dn-item-body">
                    <div className="dn-item-top">
                      <span className="dn-item-title">{note.title || 'Untitled'}</span>
                      {note.type === 'todo' && (
                        <span className="dn-badge">
                          <FiCheckSquare size={11} /> To-Do
                        </span>
                      )}
                    </div>

                    {preview(note) && (
                      <p className="dn-item-preview">{preview(note)}</p>
                    )}

                    <div className="dn-item-meta">
                      <span className="dn-item-date">
                        Deleted {note.deleted_at
                          ? new Date(note.deleted_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })
                          : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="dn-item-actions">
                    <button
                      className="dn-btn restore"
                      onClick={() => handleRestore(note.id)}
                      disabled={restoringId === note.id || deletingAll}
                      title="Restore note"
                    >
                      {restoringId === note.id ? (
                        '…'
                      ) : (
                        <><FiRotateCcw size={12} /> Restore</>
                      )}
                    </button>

                    {confirmId === note.id ? (
                      <div className="dn-confirm-row">
                        <span className="dn-confirm-label">Sure?</span>
                        <button
                          className="dn-btn perm-yes"
                          onClick={() => handlePermanentDelete(note.id)}
                          disabled={deletingId === note.id}
                        >
                          {deletingId === note.id ? '…' : 'Yes, delete'}
                        </button>
                        <button
                          className="dn-btn perm-no"
                          onClick={() => setConfirmId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="dn-btn delete"
                        onClick={() => setConfirmId(note.id)}
                        disabled={deletingAll}
                        title="Permanently delete"
                      >
                        <FiTrash2 size={12} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── footer ── */}
        {!loading && deletedNotes.length > 0 && (
          <div className="dn-footer">

            {/* left side — delete all */}
            {confirmAll ? (
              <div className="dn-confirm-all-row">
                <span className="dn-confirm-label">
                  Delete all {deletedNotes.length} notes forever?
                </span>
                <button
                  className="dn-btn perm-yes"
                  onClick={handleDeleteAll}
                  disabled={deletingAll}
                >
                  {deletingAll ? 'Deleting…' : 'Yes, delete all'}
                </button>
                <button
                  className="dn-btn perm-no"
                  onClick={() => setConfirmAll(false)}
                  disabled={deletingAll}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="dn-btn delete-all"
                onClick={() => setConfirmAll(true)}
                disabled={deletingAll}
                title="Permanently delete all notes in trash"
              >
                <FiTrash2 size={12} /> Delete all
              </button>
            )}

            {/* right side — done */}
            <button
              className="dn-close-btn"
              onClick={onClose}
              disabled={deletingAll}
            >
              Done
            </button>

          </div>
        )}

      </div>
    </div>
  );
};

export default DeletedNotesModal;