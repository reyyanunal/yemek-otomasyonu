const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

// GET isteği ile query parametreleri alacağız (/api/menuler/gunluk?tarih=...&yemekhane_id=1&ogun_id=1)
router.get('/gunluk', menuController.gunlukMenuDetay);

module.exports = router;