const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const signAccess = (payload) => jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
const signRefresh = (payload) => jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
const verifyAccess = (token) => jwt.verify(token, ACCESS_SECRET);
const verifyRefresh = (token) => jwt.verify(token, REFRESH_SECRET);

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
};

const REFRESH_COOKIE_OPTS = {
  ...COOKIE_OPTS,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh, COOKIE_OPTS, REFRESH_COOKIE_OPTS };
