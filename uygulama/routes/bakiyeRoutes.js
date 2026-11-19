const express = require('express');
const router = express.Router();
const bakiyeController = require('../controllers/bakiyeController');

// GET /api/bakiye/kullanici/1
router.get('/kullanici/:kullanici_id', bakiyeController.bakiyeOzet);

// POST /api/bakiye/yukle
router.post('/yukle', bakiyeController.bakiyeYuklemeIslemi);

module.exports = router;