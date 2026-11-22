
const express = require('express');
const router = express.Router();

const alerjenController = require('../controllers/alerjenController');
const { oturumKontrol } = require('../middleware/oturumKontrol');

// Sistemdeki alerjenleri listele
router.get('/', alerjenController.alerjenleriListele);

// Kullanıcının alerjen tercihlerini görüntüle
router.get('/tercihlerim', oturumKontrol, alerjenController.tercihlerimiGetir);

// Kullanıcının alerjen tercihlerini kaydet
router.put('/tercihlerim', oturumKontrol, alerjenController.tercihlerimiKaydet);

module.exports = router;
