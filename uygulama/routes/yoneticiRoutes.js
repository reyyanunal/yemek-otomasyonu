const express = require('express');
const router = express.Router();
const yoneticiController = require('../controllers/yoneticiController');

// POST /api/yonetici/menuler
router.post('/menuler', yoneticiController.yeniMenuOlustur);

// PUT /api/yonetici/menuler/:menu_id
router.put('/menuler/:menu_id', yoneticiController.menuGuncelle);

// GET /api/yonetici/istatistikler?yonetici_id=...
router.get('/istatistikler', yoneticiController.menuIstatistikleri);

module.exports = router;