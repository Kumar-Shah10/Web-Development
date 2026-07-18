// src/components/Dashboard/dashboardUtils.js
export const initials = (str = '') =>
  str.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

export const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const stripHtml = (html = '') => html.replace(/<[^>]*>/g, '');

export const getIsPinned   = (n) => !!(n?.is_pinned   ?? n?.pinned);
export const getIsFavorite = (n) => !!(n?.is_favorite ?? n?.favorite);
export const getIsArchived = (n) => !!(n?.is_archived ?? n?.archived);
export const getIsDeleted  = (n) => !!(n?.is_deleted  ?? n?.deleted);