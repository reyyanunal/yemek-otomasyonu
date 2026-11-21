
const Degerlendirme = require('../models/degerlendirmeModel');

const degerlendirmeYap = async (req, res) => {
    const kullanici_id = req.kullanici.kullanici_id;
    const { menu_id, puan, yorum } = req.body;
    const sayiPuan = Number(puan);

    if (
        !menu_id ||
        !Number.isInteger(sayiPuan) ||
        sayiPuan < 1 ||
        sayiPuan > 5
    ) {
        return res.status(400).json({
            hata: 'Menü ID ve 1-5 arasında tam sayı puan gereklidir.'
        });
    }

    if (yorum && yorum.length > 500) {
        return res.status(400).json({
            hata: 'Yorum en fazla 500 karakter olabilir.'
        });
    }

    try {
        // Yalnızca kullanılmış rezervasyonlar değerlendirilebilir.
        const kullanilmisMi =
            await Degerlendirme.kullanilmisRezervasyonVarMi(
                kullanici_id,
                menu_id
            );

        if (!kullanilmisMi) {
            return res.status(403).json({
                hata: 'Yalnızca kullandığınız menüleri değerlendirebilirsiniz.'
            });
        }

        // Aynı menüye ikinci kez değerlendirme yapılamaz.
        const mevcutMu =
            await Degerlendirme.dahaOnceDegerlendirmisMi(
                kullanici_id,
                menu_id
            );

        if (mevcutMu) {
            return res.status(400).json({
                hata: 'Bu menüyü daha önce değerlendirdiniz.'
            });
        }

        const degerlendirmeId =
            await Degerlendirme.degerlendirmeEkle(
                kullanici_id,
                menu_id,
                sayiPuan,
                yorum
            );

        return res.status(201).json({
            mesaj: 'Değerlendirmeniz başarıyla kaydedildi.',
            degerlendirme_id: degerlendirmeId
        });

    } catch (error) {
        console.error('Değerlendirme ekleme hatası:', error);

        return res.status(500).json({
            hata: 'Değerlendirme kaydedilirken sunucu hatası oluştu.'
        });
    }
};

const menuDegerlendirmeleri = async (req, res) => {
    const { menu_id } = req.params;

    try {
        const ozet = await Degerlendirme.menuPuanOzetiGetir(menu_id);
        const yorumlar = await Degerlendirme.menuYorumlariniGetir(menu_id);

        return res.json({
            ...ozet,
            yorumlar
        });

    } catch (error) {
        console.error('Değerlendirme listeleme hatası:', error);

        return res.status(500).json({
            hata: 'Değerlendirmeler getirilirken sunucu hatası oluştu.'
        });
    }
};

module.exports = {
    degerlendirmeYap,
    menuDegerlendirmeleri
};
