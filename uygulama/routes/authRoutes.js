const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// /api/giris adresine POST isteği geldiğinde authController.girisYap fonksiyonunu çalıştır
router.post('/giris', authController.girisYap);

module.exports = router;