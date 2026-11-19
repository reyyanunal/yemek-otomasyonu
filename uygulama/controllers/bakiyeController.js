const Bakiye = require('../models/bakiyeModel');

const bakiyeOzet = async (req, res) => {
    const { kullanici_id } = req.params;

    try {
        const kullaniciBakiye = await Bakiye.guncelBakiyeGetir(kullanici_id);
        if (!kullaniciBakiye) {
            return res.status(404).json({ hata: "Kullanıcı bulunamadı." });
        }

        const hareketler = await Bakiye.hareketGecmisiGetir(kullanici_id);

        res.json({
            kullanici_id: Number(kullanici_id),
            guncel_bakiye: kullaniciBakiye.bakiye,
            hareket_gecmisi: hareketler
        });
    } catch (error) {
        console.error("Bakiye bilgisi getirme hatası:", error);
        res.status(500).json({ hata: "Sunucu hatası oluştu." });
    }
};

const bakiyeYuklemeIslemi = async (req, res) => {
    const { kullanici_id, tutar } = req.body;
    const sayiTutar = Number(tutar);

    if (!kullanici_id || Number.isNaN(sayiTutar)) {
        return res.status(400).json({ hata: "Kullanıcı ID ve geçerli bir tutar gereklidir." });
    }

    if (sayiTutar < 10 || sayiTutar > 1000) {
        return res.status(400).json({ hata: "Tek seferde 10 TL ile 1000 TL arasında yükleme yapılabilir." });
    }

    try {
        const sonuc = await Bakiye.bakiyeYukle(kullanici_id, sayiTutar);
        res.status(201).json({
            mesaj: "Bakiye başarıyla yüklendi.",
            detay: sonuc
        });
    } catch (error) {
        console.error("Bakiye yükleme hatası:", error);
        const hataMesaji = error.sqlMessage || "Bakiye yükleme işlemi başarısız oldu.";
        res.status(400).json({ hata: hataMesaji });
    }
};

module.exports = {
    bakiyeOzet,
    bakiyeYuklemeIslemi
};