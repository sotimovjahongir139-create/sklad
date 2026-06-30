const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const prisma = require('../config/database');
const { signAccess, signRefresh, verifyRefresh, REFRESH_COOKIE_OPTS } = require('../config/jwt');
const { success, created, unauthorized, badRequest, notFound } = require('../utils/response');
const { auditLog } = require('../services/audit.service');

const buildTokenPayload = (user) => ({ id: user.id, email: user.email, role: user.role, name: user.name });

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return badRequest(res, 'Email and password required');

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return unauthorized(res, 'Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return unauthorized(res, 'Invalid credentials');

    const payload = buildTokenPayload(user);
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh({ id: user.id });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt } });

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
    await auditLog(user.id, 'LOGIN', 'User', user.id, null, null, req.ip);
    success(res, { accessToken, user: payload });
  } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return unauthorized(res, 'No refresh token');

    let payload;
    try { payload = verifyRefresh(token); } catch { return unauthorized(res, 'Invalid refresh token'); }

    const stored = await prisma.refreshToken.findUnique({ where: { token }, include: { user: true } });
    if (!stored || stored.expiresAt < new Date() || !stored.user.isActive) {
      return unauthorized(res, 'Refresh token invalid or expired');
    }

    await prisma.refreshToken.delete({ where: { token } });

    const userPayload = buildTokenPayload(stored.user);
    const newAccess = signAccess(userPayload);
    const newRefresh = signRefresh({ id: stored.user.id });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({ data: { userId: stored.user.id, token: newRefresh, expiresAt } });
    res.cookie('refreshToken', newRefresh, REFRESH_COOKIE_OPTS);
    success(res, { accessToken: newAccess, user: userPayload });
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) await prisma.refreshToken.deleteMany({ where: { token } });
    res.clearCookie('refreshToken');
    success(res, null, 'Logged out');
  } catch (err) { next(err); }
};

const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true } });
    if (!user) return notFound(res, 'User not found');
    success(res, user);
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return badRequest(res, 'Name required');
    const user = await prisma.user.update({ where: { id: req.user.id }, data: { name: name.trim() }, select: { id: true, email: true, name: true, role: true } });
    success(res, user);
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return badRequest(res, 'Current and new password required');
    if (newPassword.length < 8) return badRequest(res, 'Password must be at least 8 characters');

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return unauthorized(res, 'Current password incorrect');

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } });
    res.clearCookie('refreshToken');
    success(res, null, 'Password changed — please login again');
  } catch (err) { next(err); }
};

const register = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) return badRequest(res, 'Email, password and name required');

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, password: hashed, name, role: role || 'OPERATOR' }, select: { id: true, email: true, name: true, role: true, createdAt: true } });
    await auditLog(req.user.id, 'CREATE_USER', 'User', user.id, null, user, req.ip);
    created(res, user, 'User created');
  } catch (err) { next(err); }
};

module.exports = { login, refresh, logout, me, updateProfile, changePassword, register };
