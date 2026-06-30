const router = require('express').Router();
const c = require('../controllers/inbound.controller');
const { authenticate } = require('../middleware/auth');
const { requireOperator, requireManager } = require('../middleware/role');

router.use(authenticate);

router.get('/', c.list);
router.get('/:id', c.getById);
router.post('/', requireOperator, c.create);
router.put('/:id', requireOperator, c.update);
router.delete('/:id', requireManager, c.remove);
router.post('/:id/receive', requireOperator, c.receive);
router.post('/:id/cancel', requireManager, c.cancel);

module.exports = router;
