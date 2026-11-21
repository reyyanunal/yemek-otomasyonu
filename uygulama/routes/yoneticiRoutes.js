
const express = require('express');
const router = express.Router();

const yoneticiController = require('../controllers/yoneticiController');
const { oturumKontrol } = require('../middleware/oturumKontrol');

router.use(oturumKontrol);

router.use((req, res, next) => {
    if (req.kullanici.rol !== 'yonetici') {
        return res.status(403).json({
            hata: 'Bu işlem için yönetici yetkisi gerekiyor.'
        });
    }

    next();
});

router.post('/menuler', yoneticiController.yeniMenuOlustur);

router.put('/menuler/:menu_id', yoneticiController.menuGuncelle);

router.get('/istatistikler', yoneticiController.menuIstatistikleri);

module.exports = router;
