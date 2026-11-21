
const express = require('express');
const router = express.Router();

const bakiyeController = require('../controllers/bakiyeController');
const { oturumKontrol } = require('../middleware/oturumKontrol');

router.use(oturumKontrol);

router.get('/kullanici/:kullanici_id', bakiyeController.bakiyeOzet);

router.post('/yukle', bakiyeController.bakiyeYuklemeIslemi);

module.exports = router;
