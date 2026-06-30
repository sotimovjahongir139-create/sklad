const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const buildPagination = (total, page, limit) => ({
  total,
  page,
  limit,
  pages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

const parseSorting = (query, allowedFields, defaultField = 'createdAt') => {
  const field = allowedFields.includes(query.sortBy) ? query.sortBy : defaultField;
  const order = query.sortOrder === 'asc' ? 'asc' : 'desc';
  return { [field]: order };
};

module.exports = { parsePagination, buildPagination, parseSorting };
