const router = require('express').Router();
const c = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/inventory-trend', c.inventoryTrend);
router.get('/movement-volume', c.movementVolume);
router.get('/turnover', c.turnover);
router.get('/deadstock', c.deadstock);
router.get('/forecast/:modelId', c.forecast);
router.get('/category-breakdown', c.categoryBreakdown);

module.exports = router;
