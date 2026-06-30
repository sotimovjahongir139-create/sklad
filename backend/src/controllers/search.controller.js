const { success, badRequest } = require('../utils/response');
const searchService = require('../services/search.service');

const search = async (req, res, next) => {
  try {
    const { q, types } = req.query;
    if (!q || q.trim().length < 2) return badRequest(res, 'Query must be at least 2 characters');
    const results = await searchService.globalSearch(q.trim(), types?.split(','));
    success(res, results);
  } catch (err) { next(err); }
};

module.exports = { search };
