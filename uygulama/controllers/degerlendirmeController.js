const Degerlendirme = require('../models/degerlendirmeModel');

const degerlendirmeYap = async (req, res) => {
    const { kullanici_id, menu_id, puan, yorum } = req.body;
    const sayiPuan = Number(puan);

    if (!kullanici_id || !menu_id || !Number.isInteger(sayiPuan) || sayiPuan < 1 || sayiPuan > 5) {
        return res.status(400).json({ hata: "Kullanıcı ID, Menü ID ve 1-5 arası tam sayı puan gereklidir." });
    }

    if (yorum && yorum.length > 500) {
        return res.status(400).json({ hata: "Yorum en fazla 500 karakter olabilir." });
    }

    try {
        // Kural 1: Menü gerçekten kullanılmış olmalı
        const kullanilmisMi = await Degerlendirme.kullanilmisRezervasyonVarMi(kullanici_id, menu_id);
        if (!kullanilmisMi) {
            return res.status(403).json({ hata: "Yalnızca kullandığınız (yemek yediğiniz) menüleri değerlendirebilirsiniz." });
        }

        // Kural 2: Aynı menüye mükerrer değerlendirme engeli
        const mevcutMu = await Degerlendirme.dahaOnceDegerlendirmisMi(kullanici_id, menu_id);
        if (mevcutMu) {
            return res.status(400).json({ hata: "Bu menüyü daha önce değerlendirdiniz." });
        }

        const degerlendirmeId = await Degerlendirme.degerlendirmeEkle(kullanici_id, menu_id, sayiPuan, yorum);

        res.status(201).json({
            mesaj: "Değerlendirmeniz başarıyla kaydedildi.",
            degerlendirme_id: degerlendirmeId
        });
    } catch (error) {
        console.error("Değerlendirme ekleme hatası:", error);
        res.status(500).json({ hata: "Değerlendirme kaydedilirken sunucu hatası oluştu." });
    }
};

const menuDegerlendirmeleri = async (req, res) => {
    const { menu_id } = req.params;

    try {
        const ozet = await Degerlendirme.menuPuanOzetiGetir(menu_id);
        const yorumlar = await Degerlendirme.menuYorumlariniGetir(menu_id);

        res.json({
            ...ozet,
            yorumlar
        });
    } catch (error) {
        console.error("Değerlendirme listeleme hatası:", error);
        res.status(500).json({ hata: "Değerlendirmeler getirilirken sunucu hatası oluştu." });
    }
};

module.exports = {
    degerlendirmeYap,
    menuDegerlendirmeleri
};