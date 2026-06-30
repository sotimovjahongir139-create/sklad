const router = require('express').Router();
const c = require('../controllers/inventory.controller');
const { authenticate } = require('../middleware/auth');
const { requireManager } = require('../middleware/role');

router.use(authenticate);

router.get('/', c.list);
router.get('/summary', c.summary);
router.get('/low-stock', c.lowStock);
router.get('/by-location/:locationId', c.byLocation);
router.get('/by-model/:modelId', c.byModel);
router.post('/adjust', requireManager, c.adjust);

module.exports = router;
