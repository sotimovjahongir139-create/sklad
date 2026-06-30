const router = require('express').Router();
const c = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', c.list);
router.get('/unread-count', c.unreadCount);
router.put('/:id/read', c.markRead);
router.put('/read-all', c.markAllRead);
router.delete('/:id', c.remove);

module.exports = router;
