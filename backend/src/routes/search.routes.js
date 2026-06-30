const router = require('express').Router();
const c = require('../controllers/search.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', c.search);

module.exports = router;
