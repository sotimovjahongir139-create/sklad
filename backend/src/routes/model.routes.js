const router = require('express').Router();
const c = require('../controllers/model.controller');
const { authenticate } = require('../middleware/auth');
const { requireManager, requireOperator } = require('../middleware/role');

router.use(authenticate);

router.get('/', c.list);
router.get('/:id', c.getById);
router.post('/', requireManager, c.create);
router.put('/:id', requireManager, c.update);
router.delete('/:id', requireManager, c.remove);
router.get('/:id/inventory', c.getInventory);
router.get('/:id/movements', c.getMovements);

module.exports = router;
