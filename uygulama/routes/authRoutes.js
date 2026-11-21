
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { oturumKontrol } = require('../middleware/oturumKontrol');

router.post('/giris', authController.girisYap);

router.post('/cikis', oturumKontrol, authController.cikisYap);

module.exports = router;
