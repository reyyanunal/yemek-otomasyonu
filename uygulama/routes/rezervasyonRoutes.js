
const express = require('express');
const router = express.Router();

const rezervasyonController = require('../controllers/rezervasyonController');
const { oturumKontrol } = require('../middleware/oturumKontrol');

router.use(oturumKontrol);

router.get('/kullanici/:kullanici_id', rezervasyonController.rezervasyonlarim);

router.post('/', rezervasyonController.yeniRezervasyon);

router.patch('/:rezervasyon_id/iptal', rezervasyonController.rezervasyonIptal);

module.exports = router;
