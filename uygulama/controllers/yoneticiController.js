const Yonetici = require('../models/yoneticiModel');

const yetkiKontrol = async (yonetici_id) => {
    if (!yonetici_id) return false;
    return await Yonetici.yoneticiMi(yonetici_id);
};

const yeniMenuOlustur = async (req, res) => {
    const { yonetici_id, yemekhane_id, tarih, ogun_id, ogrenci_fiyati, personel_fiyati, yemek_idleri } = req.body;

    try {
        if (!(await yetkiKontrol(yonetici_id))) {
            return res.status(403).json({ hata: "Bu işlem için yönetici yetkisi gereklidir." });
        }

        if (!yemekhane_id || !tarih || !ogun_id || ogrenci_fiyati == null || personel_fiyati == null) {
            return res.status(400).json({ hata: "Yemekhane, tarih, öğün ve fiyat bilgileri zorunludur." });
        }

        const menuId = await Yonetici.menuOlustur({
            yemekhane_id,
            tarih,
            ogun_id,
            ogrenci_fiyati,
            personel_fiyati,
            yemek_idleri
        });

        res.status(201).json({
            mesaj: "Menü başarıyla oluşturuldu.",
            menu_id: menuId
        });
    } catch (error) {
        console.error("Menü oluşturma hatası:", error);
        const hataMesaji = error.sqlMessage || "Menü oluşturulurken hata oluştu.";
        res.status(400).json({ hata: hataMesaji });
    }
};

const menuGuncelle = async (req, res) => {
    const { menu_id } = req.params;
    const { yonetici_id, yemekhane_id, tarih, ogun_id, ogrenci_fiyati, personel_fiyati, yemek_idleri } = req.body;

    try {
        if (!(await yetkiKontrol(yonetici_id))) {
            return res.status(403).json({ hata: "Bu işlem için yönetici yetkisi gereklidir." });
        }

        if (!yemekhane_id || !tarih || !ogun_id || ogrenci_fiyati == null || personel_fiyati == null) {
            return res.status(400).json({ hata: "Güncelleme için tüm zorunlu menü alanları gereklidir." });
        }

        const guncellendi = await Yonetici.menuDuzenle(menu_id, {
            yemekhane_id,
            tarih,
            ogun_id,
            ogrenci_fiyati,
            personel_fiyati,
            yemek_idleri
        });

        if (!guncellendi) {
            return res.status(404).json({ hata: "Güncellenecek menü bulunamadı." });
        }

        res.json({
            mesaj: "Menü başarıyla güncellendi.",
            menu_id: Number(menu_id)
        });
    } catch (error) {
        console.error("Menü güncelleme hatası:", error);
        const hataMesaji = error.sqlMessage || "Menü güncellenirken hata oluştu.";
        res.status(400).json({ hata: hataMesaji });
    }
};

const menuIstatistikleri = async (req, res) => {
    const { yonetici_id } = req.query;

    try {
        if (!(await yetkiKontrol(yonetici_id))) {
            return res.status(403).json({ hata: "Bu raporu görüntülemek için yönetici yetkisi gereklidir." });
        }

        const rapor = await Yonetici.menuIstatistikleriGetir();
        res.json({
            toplam_kayit: rapor.length,
            menuler: rapor
        });
    } catch (error) {
        console.error("Menü istatistik hatası:", error);
        res.status(500).json({ hata: "İstatistikler getirilirken sunucu hatası oluştu." });
    }
};

module.exports = {
    yeniMenuOlustur,
    menuGuncelle,
    menuIstatistikleri
};