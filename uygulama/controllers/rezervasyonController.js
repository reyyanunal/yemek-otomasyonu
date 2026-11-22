
const Rezervasyon = require('../models/rezervasyonModel');

const rezervasyonlarim = async (req, res) => {
    const kullanici_id = req.kullanici.kullanici_id;

    // Kullanıcı yalnızca kendi rezervasyonlarını görüntüleyebilir.
    if (Number(req.params.kullanici_id) !== Number(kullanici_id)) {
        return res.status(403).json({
            hata: 'Başka bir kullanıcının rezervasyonları görüntülenemez.'
        });
    }

    try {
        const satirlar = await Rezervasyon.kullaniciRezervasyonlariniGetir(kullanici_id);
        const suAn = new Date();

        const sonuc = satirlar.map(satir => {
            const sureGectiMi = suAn > new Date(satir.rezervasyon_son);
            const iptalEdilebilir = (satir.durum === 'aktif' && !sureGectiMi);

            return {
                rezervasyon_id: satir.rezervasyon_id,
                menu_id: satir.menu_id,
                tarih: new Intl.DateTimeFormat('en-CA', {
                    timeZone: 'Europe/Istanbul',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }).format(satir.tarih),
                yemekhane: satir.yemekhane,
                ogun: satir.ogun,
                durum: satir.durum,
                ucret: satir.ucret,
                porsiyon: satir.porsiyon,
                iptal_edilebilir: iptalEdilebilir,
                pasif_nedeni: (!iptalEdilebilir && satir.durum === 'aktif')
                    ? 'Süre doldu'
                    : null
            };
        });

        return res.json(sonuc);
    } catch (error) {
        console.error('Rezervasyonları getirme hatası:', error);
        return res.status(500).json({
            hata: 'Sunucu hatası oluştu.'
        });
    }
};

const yeniRezervasyon = async (req, res) => {
    const kullanici_id = req.kullanici.kullanici_id;
    const { menu_id, porsiyon = 'tam' } = req.body;

    if (!menu_id) {
        return res.status(400).json({
            hata: 'Menü ID gereklidir.'
        });
    }

    try {
        const sonuc = await Rezervasyon.rezervasyonYap(kullanici_id, menu_id, porsiyon);

        return res.status(201).json({
            mesaj: 'Rezervasyon başarıyla oluşturuldu.',
            detay: sonuc
        });
    } catch (error) {
        console.error('Rezervasyon yapma hatası:', error);

        return res.status(400).json({
            hata: error.sqlMessage || 'Rezervasyon işlemi başarısız oldu.'
        });
    }
};

const rezervasyonIptal = async (req, res) => {
    const kullanici_id = req.kullanici.kullanici_id;
    const { rezervasyon_id } = req.params;

    if (!rezervasyon_id) {
        return res.status(400).json({
            hata: 'Rezervasyon ID gereklidir.'
        });
    }

    try {
        const sonuc = await Rezervasyon.rezervasyonIptalEt(
            kullanici_id,
            rezervasyon_id
        );

        return res.json({
            mesaj: 'Rezervasyon başarıyla iptal edildi.',
            detay: sonuc
        });
    } catch (error) {
        console.error('Rezervasyon iptal hatası:', error);

        return res.status(400).json({
            hata: error.sqlMessage || 'Rezervasyon iptal edilemedi.'
        });
    }
};

module.exports = {
    rezervasyonlarim,
    yeniRezervasyon,
    rezervasyonIptal
};
