
const Bakiye = require('../models/bakiyeModel');

const bakiyeOzet = async (req, res) => {
    const kullanici_id = req.kullanici.kullanici_id;

    // Kullanıcı yalnızca kendi bakiye bilgilerini görebilir.
    if (Number(req.params.kullanici_id) !== Number(kullanici_id)) {
        return res.status(403).json({
            hata: 'Başka bir kullanıcının bakiye bilgileri görüntülenemez.'
        });
    }

    try {
        const kullaniciBakiye = await Bakiye.guncelBakiyeGetir(kullanici_id);

        if (!kullaniciBakiye) {
            return res.status(404).json({
                hata: 'Kullanıcı bulunamadı.'
            });
        }

        const hareketler = await Bakiye.hareketGecmisiGetir(kullanici_id);

        return res.json({
            kullanici_id: Number(kullanici_id),
            guncel_bakiye: kullaniciBakiye.bakiye,
            hareket_gecmisi: hareketler
        });
    } catch (error) {
        console.error('Bakiye bilgisi getirme hatası:', error);

        return res.status(500).json({
            hata: 'Sunucu hatası oluştu.'
        });
    }
};

const bakiyeYuklemeIslemi = async (req, res) => {
    const kullanici_id = req.kullanici.kullanici_id;
    const { tutar } = req.body;
    const sayiTutar = Number(tutar);

    if (tutar === undefined || tutar === null ||
        tutar === '' || !Number.isFinite(sayiTutar)) {
        return res.status(400).json({
            hata: 'Geçerli bir tutar gereklidir.'
        });
    }

    if (sayiTutar < 10 || sayiTutar > 1000) {
        return res.status(400).json({
            hata: 'Tek seferde 10 TL ile 1000 TL arasında yükleme yapılabilir.'
        });
    }

    try {
        const sonuc = await Bakiye.bakiyeYukle(kullanici_id, sayiTutar);

        return res.status(201).json({
            mesaj: 'Bakiye başarıyla yüklendi.',
            detay: sonuc
        });
    } catch (error) {
        console.error('Bakiye yükleme hatası:', error);

        return res.status(400).json({
            hata: error.sqlMessage || 'Bakiye yükleme işlemi başarısız oldu.'
        });
    }
};

module.exports = {
    bakiyeOzet,
    bakiyeYuklemeIslemi
};
