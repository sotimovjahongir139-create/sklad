const router = require('express').Router();
const c = require('../controllers/outbound.controller');
const { authenticate } = require('../middleware/auth');
const { requireOperator, requireManager } = require('../middleware/role');

router.use(authenticate);

router.get('/', c.list);
router.get('/:id', c.getById);
router.post('/', requireOperator, c.create);
router.put('/:id', requireOperator, c.update);
router.delete('/:id', requireManager, c.remove);
router.post('/:id/pick', requireOperator, c.pick);
router.post('/:id/ship', requireOperator, c.ship);
router.post('/:id/cancel', requireManager, c.cancel);

module.exports = router;
