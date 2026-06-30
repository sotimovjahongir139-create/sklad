const success = (res, data = null, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const created = (res, data = null, message = 'Created') =>
  success(res, data, message, 201);

const paginated = (res, data, pagination) =>
  res.status(200).json({ success: true, data, pagination });

const error = (res, message = 'Internal server error', statusCode = 500, errors = null) =>
  res.status(statusCode).json({ success: false, message, ...(errors && { errors }) });

const notFound = (res, message = 'Not found') => error(res, message, 404);
const badRequest = (res, message = 'Bad request', errors = null) => error(res, message, 400, errors);
const unauthorized = (res, message = 'Unauthorized') => error(res, message, 401);
const forbidden = (res, message = 'Forbidden') => error(res, message, 403);
const conflict = (res, message = 'Conflict') => error(res, message, 409);

module.exports = { success, created, paginated, error, notFound, badRequest, unauthorized, forbidden, conflict };
