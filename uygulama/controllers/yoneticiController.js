
const Yonetici = require('../models/yoneticiModel');
const { redisClient } = require('../config/redis');

// Yönetici kimliği artık Redis oturumundan alınıyor.
const yetkiKontrol = async (req) => {
    const yonetici_id = req.kullanici.kullanici_id;

    if (req.kullanici.rol !== 'yonetici') {
        return false;
    }

    // Veritabanındaki yetkiyi de doğrula.
    return await Yonetici.yoneticiMi(yonetici_id);
};

const yeniMenuOlustur = async (req, res) => {
    const {
        yemekhane_id,
        tarih,
        ogun_id,
        ogrenci_fiyati,
        personel_fiyati,
        yemek_idleri
    } = req.body;

    try {
        if (!(await yetkiKontrol(req))) {
            return res.status(403).json({
                hata: 'Bu işlem için yönetici yetkisi gereklidir.'
            });
        }

        if (
            !yemekhane_id ||
            !tarih ||
            !ogun_id ||
            ogrenci_fiyati == null ||
            personel_fiyati == null
        ) {
            return res.status(400).json({
                hata: 'Yemekhane, tarih, öğün ve fiyat bilgileri zorunludur.'
            });
        }

        const menuId = await Yonetici.menuOlustur({
            yemekhane_id,
            tarih,
            ogun_id,
            ogrenci_fiyati,
            personel_fiyati,
            yemek_idleri
        });

        return res.status(201).json({
            mesaj: 'Menü başarıyla oluşturuldu.',
            menu_id: menuId
        });

    } catch (error) {
        console.error('Menü oluşturma hatası:', error);

        return res.status(400).json({
            hata: error.sqlMessage || 'Menü oluşturulurken hata oluştu.'
        });
    }
};

const menuGuncelle = async (req, res) => {
    const { menu_id } = req.params;

    const {
        yemekhane_id,
        tarih,
        ogun_id,
        ogrenci_fiyati,
        personel_fiyati,
        yemek_idleri
    } = req.body;

    try {
        if (!(await yetkiKontrol(req))) {
            return res.status(403).json({
                hata: 'Bu işlem için yönetici yetkisi gereklidir.'
            });
        }

        if (
            !yemekhane_id ||
            !tarih ||
            !ogun_id ||
            ogrenci_fiyati == null ||
            personel_fiyati == null
        ) {
            return res.status(400).json({
                hata: 'Güncelleme için tüm zorunlu menü alanları gereklidir.'
            });
        }

        // Güncellemeden önce menünün eski bilgilerini al.
        const eskiMenu = await Yonetici.menuBilgisiGetir(menu_id);

        const guncellendi = await Yonetici.menuDuzenle(menu_id, {
            yemekhane_id,
            tarih,
            ogun_id,
            ogrenci_fiyati,
            personel_fiyati,
            yemek_idleri
        });

        if (!guncellendi) {
            return res.status(404).json({
                hata: 'Güncellenecek menü bulunamadı.'
            });
        }

        // Eski ve yeni Redis önbellek anahtarlarını temizle.
        const anahtarlar = [];

        if (eskiMenu) {
            anahtarlar.push(
                `menu:${eskiMenu.yemekhane_id}:${eskiMenu.tarih}:${eskiMenu.ogun_id}`
            );
        }

        anahtarlar.push(
            `menu:${yemekhane_id}:${tarih}:${ogun_id}`
        );

        const tekilAnahtarlar = [...new Set(anahtarlar)];

        await redisClient.del(tekilAnahtarlar);

        console.log(
            `[REDIS] Menü güncellendi, önbellek temizlendi: ${tekilAnahtarlar.join(', ')}`
        );

        return res.json({
            mesaj: 'Menü başarıyla güncellendi.',
            menu_id: Number(menu_id)
        });

    } catch (error) {
        console.error('Menü güncelleme hatası:', error);

        return res.status(400).json({
            hata: error.sqlMessage || 'Menü güncellenirken hata oluştu.'
        });
    }
};

const menuIstatistikleri = async (req, res) => {
    try {
        if (!(await yetkiKontrol(req))) {
            return res.status(403).json({
                hata: 'Bu raporu görüntülemek için yönetici yetkisi gereklidir.'
            });
        }

        const rapor = await Yonetici.menuIstatistikleriGetir();

        return res.json({
            toplam_kayit: rapor.length,
            menuler: rapor
        });

    } catch (error) {
        console.error('Menü istatistik hatası:', error);

        return res.status(500).json({
            hata: 'İstatistikler getirilirken sunucu hatası oluştu.'
        });
    }
};

module.exports = {
    yeniMenuOlustur,
    menuGuncelle,
    menuIstatistikleri
};
