const router = require('express').Router();
const c = require('../controllers/warehouse.controller');
const { authenticate } = require('../middleware/auth');
const { requireManager } = require('../middleware/role');

router.use(authenticate);

router.get('/zones', c.listZones);
router.post('/zones', requireManager, c.createZone);
router.put('/zones/:id', requireManager, c.updateZone);

router.get('/locations', c.listLocations);
router.get('/locations/:id', c.getLocation);
router.post('/locations', requireManager, c.createLocation);
router.put('/locations/:id', requireManager, c.updateLocation);

router.get('/map', c.getWarehouseMap);

module.exports = router;
