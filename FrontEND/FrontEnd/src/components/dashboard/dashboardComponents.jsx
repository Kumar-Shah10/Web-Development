import { FiBookmark, FiHeart, FiArchive, FiTrash2, FiCheckSquare } from 'react-icons/fi';
import { fmtDate, stripHtml, getIsPinned, getIsFavorite, getIsArchived } from '../../utils/dashboardUtils';

export const DeleteConfirmModal = ({ onConfirm, onCancel }) => (
  <div className="db-modal-overlay">
    <div className="db-modal db-confirm-modal">
      <div className="db-confirm-icon"><FiTrash2 size={32} /></div>
      <h3 className="db-confirm-title">Delete this note?</h3>
      <p className="db-confirm-body">This will move the note to Trash. You can restore it from there.</p>
      <div className="db-confirm-actions">
        <button className="db-confirm-cancel" onClick={onCancel}>Cancel</button>
        <button className="db-confirm-delete" onClick={onConfirm}>Delete</button>
      </div>
    </div>
  </div>
);

export const NoteCard = ({ note, index = 0, active, onSelect, onPin, onFav, onArchive, onDelete }) => {
  const isPinned   = getIsPinned(note);
  const isFav      = getIsFavorite(note);
  const isArchived = getIsArchived(note);

  const preview = note.type === 'todo'
    ? (() => {
        try {
          const items = JSON.parse(note.content || '[]');
          const done = items.filter(t => t.done).length;
          return `${done} / ${items.length} tasks done`;
        } catch { return ''; }
      })()
    : stripHtml(note.content || '');

  return (
    <div
      className={`db-card${isPinned ? ' pinned' : ''}${active ? ' active' : ''}`}
      style={{ animationDelay: `${index * 30}ms` }}
      onClick={onSelect}
    >
      {note.color && note.color !== '#FFFFFF' && (
        <div className="db-card-color" style={{ background: note.color }} />
      )}

      <div className="db-card-title">{note.title || 'Untitled'}</div>
      {preview && <div className="db-card-preview">{preview}</div>}

      <div className="db-card-meta">
        <span className="db-card-date">
          {fmtDate(note.updated_at || note.updatedAt || note.created_at || note.createdAt)}
        </span>
        <div className="db-card-badges">
          {isPinned   && <span className="db-badge pinned" title="Pinned"><FiBookmark size={11} /></span>}
          {isFav      && <span className="db-badge fav"    title="Favourite"><FiHeart size={11} /></span>}
          {isArchived && <span className="db-badge"        title="Archived"><FiArchive size={11} /></span>}
          {note.type === 'todo' && <span className="db-badge" title="To-Do"><FiCheckSquare size={11} /></span>}
        </div>
      </div>

      <div className="db-card-actions" onClick={e => e.stopPropagation()}>
        <button className={`db-card-action${isPinned ? ' active' : ''}`} onClick={onPin} title={isPinned ? 'Unpin' : 'Pin'}>
          <FiBookmark size={12} />
        </button>
        <button className={`db-card-action${isFav ? ' active' : ''}`} onClick={onFav} title={isFav ? 'Unsave' : 'Save'}>
          <FiHeart size={12} />
        </button>
        <button className={`db-card-action${isArchived ? ' active' : ''}`} onClick={onArchive} title={isArchived ? 'Unarchive' : 'Archive'}>
          <FiArchive size={12} />
        </button>
        <button className="db-card-action danger" onClick={onDelete} title="Delete">
          <FiTrash2 size={12} />
        </button>
      </div>
    </div>
  );
};