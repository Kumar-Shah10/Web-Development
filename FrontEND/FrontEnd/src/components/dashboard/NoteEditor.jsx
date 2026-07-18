import { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/note-editor.css';

/* ─── helpers ─── */
const fmtDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const COLORS = [
  { value: null,      label: 'Default' },
  { value: '#d4aa64', label: 'Gold'    },
  { value: '#a78bfa', label: 'Violet'  },
  { value: '#f87171', label: 'Rose'    },
  { value: '#60a5fa', label: 'Blue'    },
  { value: '#4ade80', label: 'Green'   },
  { value: '#fb923c', label: 'Amber'   },
];

/* ─── which toolbar cmds to track ─── */
const TRACKED = [
  'bold', 'italic', 'underline', 'strikeThrough',
  'insertUnorderedList', 'insertOrderedList',
  'justifyLeft', 'justifyCenter', 'justifyRight',
];

/* ─── autosave delay ─── */
const AUTOSAVE_DELAY = 5000; 

/* ─── single hook: one selectionchange listener, returns a Set of active cmds ─── */
function useActiveFormats() {
  const [active, setActive] = useState(new Set());

  useEffect(() => {
    const update = () => {
      const next = new Set();
      TRACKED.forEach(cmd => {
        try {
          if (document.queryCommandState(cmd)) next.add(cmd);
        } catch { /* ignore */ }
      });
      setActive(prev => {
        if (prev.size !== next.size) return next;
        for (const c of next) if (!prev.has(c)) return next;
        return prev;
      });
    };

    document.addEventListener('selectionchange', update);
    document.addEventListener('keyup', update);
    document.addEventListener('mouseup', update);
    return () => {
      document.removeEventListener('selectionchange', update);
      document.removeEventListener('keyup', update);
      document.removeEventListener('mouseup', update);
    };
  }, []);

  return active;
}

/* ─── SVGs ─── */
const CheckIcon = () => (
  <svg viewBox="0 0 10 8" fill="none" width="10" height="8">
    <path d="M1 4l2.8 2.8L9 1" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const AlignLeftIcon = () => (
  <svg viewBox="0 0 14 12" fill="none" width="14" height="12">
    <rect x="0" y="0"  width="14" height="1.8" rx="0.9" fill="currentColor"/>
    <rect x="0" y="5"  width="9"  height="1.8" rx="0.9" fill="currentColor"/>
    <rect x="0" y="10" width="14" height="1.8" rx="0.9" fill="currentColor"/>
  </svg>
);
const AlignCenterIcon = () => (
  <svg viewBox="0 0 14 12" fill="none" width="14" height="12">
    <rect x="0"   y="0"  width="14" height="1.8" rx="0.9" fill="currentColor"/>
    <rect x="2.5" y="5"  width="9"  height="1.8" rx="0.9" fill="currentColor"/>
    <rect x="0"   y="10" width="14" height="1.8" rx="0.9" fill="currentColor"/>
  </svg>
);
const AlignRightIcon = () => (
  <svg viewBox="0 0 14 12" fill="none" width="14" height="12">
    <rect x="0" y="0"  width="14" height="1.8" rx="0.9" fill="currentColor"/>
    <rect x="5" y="5"  width="9"  height="1.8" rx="0.9" fill="currentColor"/>
    <rect x="0" y="10" width="14" height="1.8" rx="0.9" fill="currentColor"/>
  </svg>
);

/* ════════════════════════════════════════════════
   TODO ITEM
════════════════════════════════════════════════ */
const TodoItem = ({ item, index, onChange, onDelete, onKeyDown, inputRef }) => (
  <div className="ne-todo-row">
    <button
      className={`ne-checkbox${item.done ? ' checked' : ''}`}
      onMouseDown={e => e.preventDefault()}
      onClick={() => onChange(index, { ...item, done: !item.done })}
    >
      {item.done && <CheckIcon />}
    </button>
    <input
      ref={inputRef}
      className={`ne-row-input${item.done ? ' done' : ''}`}
      value={item.text}
      placeholder="Write a task…"
      onChange={e => onChange(index, { ...item, text: e.target.value })}
      onKeyDown={e => onKeyDown(e, index)}
    />
    <button
      className="ne-row-remove"
      onMouseDown={e => e.preventDefault()}
      onClick={() => onDelete(index)}
      title="Remove"
    >
      <svg viewBox="0 0 10 10" fill="none" width="9" height="9">
        <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    </button>
  </div>
);

/* ════════════════════════════════════════════════
   NOTE EDITOR
════════════════════════════════════════════════ */
const NoteEditor = ({
  note, onClose, onSave, onDelete,
  onExportPDF, onTogglePin, onToggleFavorite, onToggleArchive,
}) => {
  const isTodo = note?.type === 'todo';

  const [title,      setTitle]      = useState(note?.title || '');
  const [todos,      setTodos]      = useState(() => {
    if (isTodo) {
      try {
        const parsed = JSON.parse(note.content || '[]');
        const items = Array.isArray(parsed) && parsed.length > 0
          ? parsed
          : Array.from({ length: 5 }, () => ({ text: '', done: false }));
        return items;
      } catch {
        return Array.from({ length: 5 }, () => ({ text: '', done: false }));
      }
    }
    return [];
  });
  const [color,      setColor]      = useState(note?.color || null);
  const [isDirty,    setIsDirty]    = useState(false);
  const [isSaving,   setIsSaving]   = useState(false);
  const [lastSaved,  setLastSaved]  = useState(null);
  const [showColors, setShowColors] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState(null); 

  const editorRef    = useRef(null);
  const colorMenuRef = useRef(null);
  const todoRefs     = useRef([]);
  const autosaveTimerRef = useRef(null);

  const activeFormats = useActiveFormats();

  useEffect(() => {
    if (!isTodo && editorRef.current) {
      editorRef.current.innerHTML = note?.content || '';
      editorRef.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isTodo) {
      const firstEmpty = todos.findIndex(t => t.text === '');
      const idx = firstEmpty >= 0 ? firstEmpty : 0;
      setTimeout(() => todoRefs.current[idx]?.focus(), 80);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (colorMenuRef.current && !colorMenuRef.current.contains(e.target))
        setShowColors(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const markDirty = useCallback(() => setIsDirty(true), []);

  const exec = useCallback((cmd, val = null) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand(cmd, false, val);
    document.dispatchEvent(new Event('selectionchange'));
    markDirty();
  }, [markDirty]);

const noteId = note?.id;

/* ── save (used by both manual Save button and autosave) ── */
const handleSave = useCallback(async ({ silent = false } = {}) => {
  if (silent) setAutosaveStatus('saving');
  else setIsSaving(true);

  try {
    const body = isTodo
      ? JSON.stringify(todos)
      : editorRef.current?.innerHTML || '';
    await onSave(noteId, title, body, color);
    setLastSaved(new Date());
    setIsDirty(false);
    if (silent) {
      setAutosaveStatus('saved');
      setTimeout(() => setAutosaveStatus(null), 2000);
    }
  } catch (e) {
    console.error(e);
    if (silent) setAutosaveStatus(null);
  } finally {
    if (!silent) setIsSaving(false);
  }
}, [isTodo, todos, title, color, onSave, noteId]);

 
  useEffect(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    if (isDirty && !isSaving) {
      autosaveTimerRef.current = setTimeout(() => {
        handleSave({ silent: true });
      }, AUTOSAVE_DELAY);
    }

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [isDirty, isSaving, handleSave]);

  const handleSaveClick = () => handleSave({ silent: false });

  /* ── todo helpers ── */
  const todoChange = (i, updated) => {
    setTodos(t => t.map((item, idx) => idx === i ? updated : item));
    markDirty();
  };

  const todoDelete = (i) => {
    setTodos(t => {
      if (t.length <= 1) return [{ text: '', done: false }];
      return t.filter((_, idx) => idx !== i);
    });
    markDirty();
  };

  const todoKeyDown = (e, i) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setTodos(t => [
        ...t.slice(0, i + 1),
        { text: '', done: false },
        ...t.slice(i + 1),
      ]);
      setTimeout(() => todoRefs.current[i + 1]?.focus(), 0);
      markDirty();
    }
    if (e.key === 'Backspace' && todos[i].text === '' && todos.length > 1) {
      e.preventDefault();
      todoDelete(i);
      setTimeout(() => todoRefs.current[Math.max(0, i - 1)]?.focus(), 0);
    }
  };

  const addTodo = () => {
    setTodos(t => [...t, { text: '', done: false }]);
    markDirty();
    setTimeout(() => todoRefs.current[todos.length]?.focus(), 0);
  };

  const doneCount  = todos.filter(t => t.done).length;
  const totalCount = todos.length;
  const pct        = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const GROUPS = [
    {
      key: 'fmt',
      btns: [
        { cmd: 'bold',          label: <span className="tl tl-bold">B</span>,     title: 'Bold (Ctrl+B)'      },
        { cmd: 'italic',        label: <span className="tl tl-italic">I</span>,   title: 'Italic (Ctrl+I)'    },
        { cmd: 'underline',     label: <span className="tl tl-under">U</span>,    title: 'Underline (Ctrl+U)' },
        { cmd: 'strikeThrough', label: <span className="tl tl-strike">abe</span>, title: 'Strikethrough'      },
      ],
    },
    {
      key: 'list',
      btns: [
        { cmd: 'insertUnorderedList', label: <span className="tl">• list</span>,  title: 'Bullet list'   },
        { cmd: 'insertOrderedList',   label: <span className="tl">1. list</span>, title: 'Numbered list' },
      ],
    },
    {
      key: 'head',
      btns: [
        { cmd: 'formatBlock', value: 'H1', label: <span className="tl">H1</span>, title: 'Heading 1' },
        { cmd: 'formatBlock', value: 'H2', label: <span className="tl">H2</span>, title: 'Heading 2' },
        { cmd: 'formatBlock', value: 'P',  label: <span className="tl">¶</span>,  title: 'Paragraph' },
      ],
    },
    {
      key: 'align',
      btns: [
        { cmd: 'justifyLeft',   label: <AlignLeftIcon />,   title: 'Align left' },
        { cmd: 'justifyCenter', label: <AlignCenterIcon />, title: 'Center'     },
        { cmd: 'justifyRight',  label: <AlignRightIcon />,  title: 'Align right'},
      ],
    },
  ];

  /* ════ RENDER ════ */
  return (
    <div className="ne-root">

      {/* ── top bar ── */}
      <div className="ne-topbar">
        <button className="ne-back" onClick={onClose}>←</button>
        <div className="ne-topbar-actions">
          <button
            className={`ne-action${note?.pinned ? ' active' : ''}`}
            onClick={() => onTogglePin(note.id)}
          >
            ◆ {note?.pinned ? 'Pinned' : 'Pin'}
          </button>
          <button
            className={`ne-action${note?.favorite ? ' active' : ''}`}
            onClick={() => onToggleFavorite(note.id)}
          >
            ♥ {note?.favorite ? 'Fav' : 'Fav'}
          </button>
          <button
            className={`ne-action${note?.archived ? ' active' : ''}`}
            onClick={() => onToggleArchive(note.id)}
          >
            ⊟ {note?.archived ? 'Unarchive' : 'Archive'}
          </button>
          <button className="ne-action" onClick={() => onExportPDF(note.id)}>
            ↓ PDF
          </button>

          {/* color picker */}
          <div className="ne-color-wrap" ref={colorMenuRef}>
            <button className="ne-action" onClick={() => setShowColors(v => !v)}>
              <span className="ne-color-dot" style={{ background: color || 'var(--text-faint)' }} />
              Color
            </button>
            {showColors && (
              <div className="ne-color-menu">
                {COLORS.map(c => (
                  <button
                    key={c.label}
                    className={`ne-color-opt${color === c.value ? ' selected' : ''}`}
                    style={{ background: c.value || 'var(--bg-hover)' }}
                    title={c.label}
                    onClick={() => { setColor(c.value); setShowColors(false); markDirty(); }}
                  />
                ))}
              </div>
            )}
          </div>

          <button className="ne-action danger" onClick={() => onDelete(note.id)}>
            ⊗ Delete
          </button>
          <button
            className="ne-save"
            onClick={handleSaveClick}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? '…' : '✓ Save'}
          </button>
        </div>
      </div>

      {color && <div className="ne-color-bar" style={{ background: color }} />}

      {/* ── rich-text toolbar (note only) ── */}
      {!isTodo && (
        <div className="ne-toolbar">
          {GROUPS.map((g, gi) => (
            <div key={g.key} className={`ne-tgroup${gi < GROUPS.length - 1 ? ' sep' : ''}`}>
              {g.btns.map(b => {
                const isActive = activeFormats.has(b.cmd);
                return (
                  <button
                    key={b.cmd + (b.value || '')}
                    className={`ne-tbtn${isActive ? ' active' : ''}`}
                    title={b.title}
                    onMouseDown={e => {
                      e.preventDefault();
                      exec(b.cmd, b.value || null);
                    }}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          ))}

          {/* clear formatting */}
          <div className="ne-tgroup">
            <button
              className="ne-tbtn"
              title="Clear formatting"
              onMouseDown={e => {
                e.preventDefault();
                exec('removeFormat');
              }}
            >
              <span className="tl tl-clear">Tx</span>
            </button>
          </div>
        </div>
      )}

      {/* ── body ── */}
      <div className="ne-body">

        {/* title + meta — always shown */}
        <div className="ne-header-area">
          <input
            className="ne-title"
            value={title}
            placeholder="Untitled"
            onChange={e => { setTitle(e.target.value); markDirty(); }}
          />
          <div className="ne-meta-row">
            {note?.createdAt && (
              <span className="ne-meta">Created {fmtDate(note.createdAt)}</span>
            )}
            {autosaveStatus === 'saving' && (
              <span className="ne-meta">Autosaving…</span>
            )}
            {autosaveStatus === 'saved' && (
              <span className="ne-meta ne-saved">✓ Autosaved</span>
            )}
            {autosaveStatus === null && lastSaved && (
              <span className="ne-meta ne-saved">✓ Saved {fmtDate(lastSaved)}</span>
            )}
            {autosaveStatus === null && isDirty && !lastSaved && (
              <span className="ne-meta ne-unsaved">● Unsaved changes</span>
            )}
          </div>
        </div>

        {/* ── rich text area ── */}
        {!isTodo && (
          <div
            ref={editorRef}
            className="ne-content"
            contentEditable={true}
            suppressContentEditableWarning={true}
            onInput={markDirty}
            data-placeholder="Start writing…"
          />
        )}

        {/* ── TODO CARD ── */}
        {isTodo && (
          <div className="ne-todo-card">

            <div className="ne-todo-header">
              <span className="ne-todo-title">MY PLANS</span>
            </div>

            <div className="ne-todo-body">

              {totalCount > 0 && (
                <div className="ne-progress-wrap">
                  <div className="ne-progress-track">
                    <div className="ne-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="ne-progress-label">{doneCount}/{totalCount} done</span>
                </div>
              )}

              <div className="ne-todo-scroll">
                {todos.map((item, i) => (
                  <TodoItem
                    key={i}
                    item={item}
                    index={i}
                    onChange={todoChange}
                    onDelete={todoDelete}
                    onKeyDown={todoKeyDown}
                    inputRef={el => (todoRefs.current[i] = el)}
                  />
                ))}
              </div>

              <button className="ne-todo-add" onClick={addTodo}>
                <svg viewBox="0 0 12 12" fill="none" width="11" height="11">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                Add task
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default NoteEditor;