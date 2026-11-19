const Rezervasyon = require('../models/rezervasyonModel');

const rezervasyonlarim = async (req, res) => {
    const { kullanici_id } = req.params;

    try {
        const satirlar = await Rezervasyon.kullaniciRezervasyonlariniGetir(kullanici_id);
        const suAn = new Date();

        const sonuc = satirlar.map(satir => {
            // İŞ KURALI: Sadece durumu 'aktif' olan ve son rezervasyon saati geçmemiş olanlar iptal edilebilir.
            const sureGectiMi = suAn > new Date(satir.rezervasyon_son);
            const iptalEdilebilir = (satir.durum === 'aktif' && !sureGectiMi);

            return {
                rezervasyon_id: satir.rezervasyon_id,
                tarih: satir.tarih.toISOString().split('T')[0],
                yemekhane: satir.yemekhane,
                ogun: satir.ogun,
                durum: satir.durum,
                ucret: satir.ucret,
                iptal_edilebilir: iptalEdilebilir,
                pasif_nedeni: (!iptalEdilebilir && satir.durum === 'aktif') ? "Süre doldu" : null
            };
        });

        res.json(sonuc);
    } catch (error) {
        console.error("Rezervasyonları getirme hatası:", error);
        res.status(500).json({ hata: "Sunucu hatası oluştu." });
    }
};

const yeniRezervasyon = async (req, res) => {
    const { kullanici_id, menu_id } = req.body;

    if (!kullanici_id || !menu_id) {
        return res.status(400).json({ hata: "Kullanıcı ID ve Menü ID gereklidir." });
    }

    try {
        const sonuc = await Rezervasyon.rezervasyonYap(kullanici_id, menu_id);
        
        res.status(201).json({
            mesaj: "Rezervasyon başarıyla oluşturuldu.",
            detay: sonuc
        });
    } catch (error) {
        console.error("Rezervasyon yapma hatası:", error);
        const hataMesaji = error.sqlMessage || "Rezervasyon işlemi başarısız oldu.";
        res.status(400).json({ hata: hataMesaji });
    }
};

const rezervasyonIptal = async (req, res) => {
    const { rezervasyon_id } = req.params;
    const { kullanici_id } = req.body;

    if (!kullanici_id || !rezervasyon_id) {
        return res.status(400).json({ hata: "Kullanıcı ID ve Rezervasyon ID gereklidir." });
    }

    try {
        const sonuc = await Rezervasyon.rezervasyonIptalEt(kullanici_id, rezervasyon_id);
        res.json({
            mesaj: "Rezervasyon başarıyla iptal edildi.",
            detay: sonuc
        });
    } catch (error) {
        console.error("Rezervasyon iptal hatası:", error);
        const hataMesaji = error.sqlMessage || "Rezervasyon iptal edilemedi.";
        res.status(400).json({ hata: hataMesaji });
    }
};

module.exports = { rezervasyonlarim, yeniRezervasyon,rezervasyonIptal};