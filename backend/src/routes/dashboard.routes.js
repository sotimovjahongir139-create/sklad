const router = require('express').Router();
const c = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/stats', c.stats);
router.get('/recent-activity', c.recentActivity);
router.get('/alerts', c.alerts);

module.exports = router;
