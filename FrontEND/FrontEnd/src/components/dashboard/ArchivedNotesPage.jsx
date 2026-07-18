import { useState, useEffect, useMemo, useCallback } from 'react';
import { FiArchive, FiSearch } from 'react-icons/fi';
import { useNotes } from '../../hooks/useNotes';
import { notesAPI } from '../../services/api';
import { downloadPDF } from '../../utils/storage';
import NoteEditor from './NoteEditor';
import { NoteCard, DeleteConfirmModal } from './dashboardComponents';

import '../styles/dashboard.css';

const ArchivedNotesPage = ({ refreshAll }) => {
  const {
    notes, loading,
    fetchNotes, updateNote, deleteNote,
    togglePin, toggleArchive, toggleFavorite,
  } = useNotes();

  const [activeNote, setActiveNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filters = useMemo(() => ({
    archived: true,
    ...(searchTerm && { search: searchTerm }),
  }), [searchTerm]);

  const fetchCurrentNotes = useCallback(() => fetchNotes(filters), [fetchNotes, filters]);

  useEffect(() => {
    fetchCurrentNotes();
  }, [fetchCurrentNotes]);

  const handleSave = async (id, title, content, color) => {
    try {
      await updateNote(id, title, content, color);
      fetchCurrentNotes();
      refreshAll();
    } catch (e) { console.error(e); }
  };

  const handleExportPDF = async (id) => {
    try {
      const note = notes.find(n => n.id === id);
      const res = await notesAPI.exportToPDF(id);
      downloadPDF(res.data, `${note?.title ?? 'note'}.pdf`);
    } catch (e) { console.error(e); }
  };

  const handleTogglePin = async (id) => {
    try {
      await togglePin(id);
      fetchCurrentNotes();
      setActiveNote(prev => prev?.id === id ? { ...prev, pinned: !prev.pinned } : prev);
      refreshAll();
    } catch (e) { console.error(e); }
  };

  const handleToggleFavorite = async (id) => {
    try {
      await toggleFavorite(id);
      fetchCurrentNotes();
      setActiveNote(prev => prev?.id === id ? { ...prev, favorite: !prev.favorite } : prev);
      refreshAll();
    } catch (e) { console.error(e); }
  };

  const handleToggleArchive = async (id) => {
    try {
      await toggleArchive(id);
      if (activeNote?.id === id) setActiveNote(null);
      fetchCurrentNotes();
      refreshAll();
    } catch (e) { console.error(e); }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    await deleteNote(deleteConfirm);
    if (activeNote?.id === deleteConfirm) setActiveNote(null);
    setDeleteConfirm(null);
    fetchCurrentNotes();
    refreshAll();
  };

  const sortedNotes = useMemo(() => {
    return [...(notes ?? [])].sort((a, b) => {
      const da = new Date(a.updated_at ?? a.updatedAt ?? a.created_at ?? 0);
      const db = new Date(b.updated_at ?? b.updatedAt ?? b.created_at ?? 0);
      return db - da;
    });
  }, [notes]);

  return (
    <>
      <div className="db-topbar">
        <span className="db-topbar-title">Archived</span>
        <div className="db-search-wrap">
          <span className="db-search-icon"><FiSearch size={13} /></span>
          <input
            className="db-search"
            placeholder="Search archived notes…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="db-body">
        <div className="db-notes-pane">
          {loading ? (
            <div className="db-loading">
              <span className="db-loading-dot" /><span className="db-loading-dot" /><span className="db-loading-dot" />
            </div>
          ) : sortedNotes.length === 0 ? (
            <div className="db-empty">
              <div className="db-empty-icon"><FiArchive size={36} /></div>
              <h3>Nothing archived</h3>
              <p>Archived notes will appear here.</p>
            </div>
          ) : (
            <div className="db-grid">
              {sortedNotes.map((note, i) => (
                <NoteCard key={note.id} index={i} note={note}
                  active={activeNote?.id === note.id}
                  onSelect={() => setActiveNote(note)}
                  onPin={() => handleTogglePin(note.id)}
                  onFav={() => handleToggleFavorite(note.id)}
                  onArchive={() => handleToggleArchive(note.id)}
                  onDelete={() => setDeleteConfirm(note.id)}
                />
              ))}
            </div>
          )}
        </div>

        {activeNote && (
          <NoteEditor
            key={activeNote.id}
            note={activeNote}
            onClose={() => setActiveNote(null)}
            onSave={handleSave}
            onDelete={id => setDeleteConfirm(id)}
            onExportPDF={handleExportPDF}
            onTogglePin={handleTogglePin}
            onToggleFavorite={handleToggleFavorite}
            onToggleArchive={handleToggleArchive}
          />
        )}
      </div>

      {deleteConfirm && (
        <DeleteConfirmModal
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </>
  );
};

export default ArchivedNotesPage;