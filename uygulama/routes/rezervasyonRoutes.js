const express = require('express');
const router = express.Router();
const rezervasyonController = require('../controllers/rezervasyonController');

// GET /api/rezervasyonlar/kullanici/1
router.get('/kullanici/:kullanici_id', rezervasyonController.rezervasyonlarim);
// POST /api/rezervasyonlar
router.post('/', rezervasyonController.yeniRezervasyon);

// PATCH /api/rezervasyonlar/368/iptal
router.patch('/:rezervasyon_id/iptal', rezervasyonController.rezervasyonIptal);

module.exports = router;