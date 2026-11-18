const express = require('express');
const router = express.Router();
const rezervasyonController = require('../controllers/rezervasyonController');

// GET /api/rezervasyonlar/kullanici/1
router.get('/kullanici/:kullanici_id', rezervasyonController.rezervasyonlarim);

module.exports = router;