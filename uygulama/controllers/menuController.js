const Menu = require('../models/menuModel');

const gunlukMenuDetay = async (req, res) => {
    const { tarih, yemekhane_id, ogun_id } = req.query;

    if (!tarih || !yemekhane_id || !ogun_id) {
        return res.status(400).json({ hata: "Tarih, yemekhane_id ve ogun_id gereklidir." });
    }

    try {
        const satirlar = await Menu.gunlukMenuGetir(tarih, yemekhane_id, ogun_id);

        if (satirlar.length === 0) {
            return res.status(404).json({ mesaj: "Bu kriterlere uygun menü bulunamadı." });
        }

        // Yönerge: Toplam kaloriyi uygulama toplar.
        let toplamKalori = 0;
        let yemekler = [];
        let alerjenKumesi = new Set();
        let hepsiVejetaryen = true;

        satirlar.forEach(satir => {
            toplamKalori += satir.kalori || 0;
            
            yemekler.push({
                ad: satir.yemek,
                kategori: satir.kategori,
                kalori: satir.kalori,
                vejetaryen: satir.vejetaryen === 1
            });

            if (satir.vejetaryen === 0) hepsiVejetaryen = false;
            
            if (satir.alerjenler) {
                satir.alerjenler.split(',').forEach(a => alerjenKumesi.add(a.trim()));
            }
        });

        res.json({
            menu_id: satirlar[0].menu_id,
            yemekhane: satirlar[0].yemekhane,
            ogun: satirlar[0].ogun,
            rezervasyon_son: satirlar[0].rezervasyon_son,
            ogrenci_fiyati: satirlar[0].ogrenci_fiyati,
            personel_fiyati: satirlar[0].personel_fiyati,
            toplam_kalori: toplamKalori,
            tamamen_vejetaryen: hepsiVejetaryen,
            alerjenler: Array.from(alerjenKumesi),
            yemekler: yemekler
        });

    } catch (error) {
        console.error("Menü getirme hatası:", error);
        res.status(500).json({ hata: "Sunucu hatası oluştu." });
    }
};

module.exports = { gunlukMenuDetay };