const express = require('express');
const router = express.Router();
const degerlendirmeController = require('../controllers/degerlendirmeController');

// POST /api/degerlendirmeler
router.post('/', degerlendirmeController.degerlendirmeYap);

// GET /api/degerlendirmeler/menu/15
router.get('/menu/:menu_id', degerlendirmeController.menuDegerlendirmeleri);

module.exports = router;