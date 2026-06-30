const router = require('express').Router();
const { login, refresh, logout, me, register, updateProfile, changePassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const { authLimiter } = require('../middleware/rateLimit');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login success }
 *       401: { description: Invalid credentials }
 */
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.put('/me', authenticate, updateProfile);
router.put('/me/password', authenticate, changePassword);
router.post('/register', authenticate, requireAdmin, register);

module.exports = router;
