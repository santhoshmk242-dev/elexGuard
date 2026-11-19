'use strict';
function parsePaging(query, { defaultLimit = 10, maxLimit = 100, allowedSort = [], defaultSort = '-createdAt' } = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  let sort = defaultSort;
  if (typeof query.sort === 'string' && query.sort) {
    const field = query.sort.replace(/^-/, '');
    if (allowedSort.includes(field)) sort = query.sort;
  }
  return { page, limit, skip: (page - 1) * limit, sort };
}

function pageMeta(total, { page, limit }) {
  return { total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) };
}

// Escape user input before using it inside a RegExp (prevents ReDoS / regex injection).
function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { parsePaging, pageMeta, escapeRegex };
