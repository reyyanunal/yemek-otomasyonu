
const Alerjen = require('../models/alerjenModel');

// Sistemdeki alerjenleri listele
const alerjenleriListele = async (req, res) => {
    try {
        const alerjenler = await Alerjen.tumAlerjenler();
        return res.json({ alerjenler });
    } catch (error) {
        console.error('Alerjen listeleme hatası:', error);
        return res.status(500).json({
            hata: 'Alerjenler getirilemedi.'
        });
    }
};

// Giriş yapan kullanıcının tercihlerini getir
const tercihlerimiGetir = async (req, res) => {
    try {
        const kullanici_id = req.kullanici.kullanici_id;
        const tercihler = await Alerjen.kullaniciAlerjenleri(kullanici_id);

        return res.json({ tercihler });
    } catch (error) {
        console.error('Alerjen tercihlerini getirme hatası:', error);
        return res.status(500).json({
            hata: 'Alerjen tercihleri getirilemedi.'
        });
    }
};

// Giriş yapan kullanıcının tercihlerini güncelle
const tercihlerimiKaydet = async (req, res) => {
    const kullanici_id = req.kullanici.kullanici_id;
    const { alerjen_idleri } = req.body;

    if (
        !Array.isArray(alerjen_idleri) ||
        !alerjen_idleri.every(id => Number.isInteger(id) && id > 0) ||
        new Set(alerjen_idleri).size !== alerjen_idleri.length
    ) {
        return res.status(400).json({
            hata: 'Alerjen ID listesi geçersiz.'
        });
    }

    try {
        await Alerjen.alerjenTercihleriniKaydet(
            kullanici_id,
            alerjen_idleri
        );

        return res.json({
            mesaj: 'Alerjen tercihleri kaydedildi.'
        });
    } catch (error) {
        console.error('Alerjen tercihlerini kaydetme hatası:', error);
        return res.status(500).json({
            hata: 'Alerjen tercihleri kaydedilemedi.'
        });
    }
};

module.exports = {
    alerjenleriListele,
    tercihlerimiGetir,
    tercihlerimiKaydet
};
