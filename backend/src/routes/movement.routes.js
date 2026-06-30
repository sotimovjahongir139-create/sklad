const router = require('express').Router();
const c = require('../controllers/movement.controller');
const { authenticate } = require('../middleware/auth');
const { requireOperator } = require('../middleware/role');

router.use(authenticate);

router.get('/', c.list);
router.get('/:id', c.getById);
router.post('/transfer', requireOperator, c.transfer);
router.post('/adjust', requireOperator, c.adjust);

module.exports = router;
