
const express = require('express');
const router = express.Router();

const degerlendirmeController = require('../controllers/degerlendirmeController');
const { oturumKontrol } = require('../middleware/oturumKontrol');

router.post('/', oturumKontrol, degerlendirmeController.degerlendirmeYap);

router.get('/menu/:menu_id', degerlendirmeController.menuDegerlendirmeleri);

module.exports = router;
