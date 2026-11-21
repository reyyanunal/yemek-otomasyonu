const Menu = require('../models/menuModel');
const { redisClient } = require('../config/redis');


const gunlukMenuDetay = async (req, res) => {
    const { tarih, yemekhane_id, ogun_id } = req.query;

    if (!tarih || !yemekhane_id || !ogun_id) {
        return res.status(400).json({
            hata: "Tarih, yemekhane_id ve ogun_id gereklidir."
        });
    }

    const cacheKey = `menu:${yemekhane_id}:${tarih}:${ogun_id}`;

    try {
        // 1. Önce Redis önbelleğini kontrol et
        const cacheVerisi = await redisClient.get(cacheKey);

        if (cacheVerisi) {
            console.log(`[REDIS] Menü önbellekten getirildi: ${cacheKey}`);
            return res.json(JSON.parse(cacheVerisi));
        }

        // 2. Redis'te yoksa MySQL replikasından getir
        console.log(`[MYSQL] Menü veritabanından getiriliyor: ${cacheKey}`);

        const satirlar = await Menu.gunlukMenuGetir(
            tarih, yemekhane_id, ogun_id
        );

        if (satirlar.length === 0) {
            return res.status(404).json({
                mesaj: "Bu kriterlere uygun menü bulunamadı."
            });
        }

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
                vejetaryen: satir.vejetaryen === 1,
                alerjenler: satir.alerjenler
                    ? satir.alerjenler.split(',').map(a => a.trim())
                    : [],
                alerjen_idler: satir.alerjen_idler
            });

            if (satir.vejetaryen === 0) {
                hepsiVejetaryen = false;
            }

            if (satir.alerjenler) {
                satir.alerjenler.split(',').forEach(a => {
                    alerjenKumesi.add(a.trim());
                });
            }
        });

        const sonuc = {
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
        };

        // 3. Türkiye saatine göre gün sonuna kalan süre
        const simdi = new Date();
        const tarihParcalari = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/Istanbul',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23'
        }).formatToParts(simdi);

        const parca = (tip) =>
            tarihParcalari.find(p => p.type === tip).value;

        const yil = Number(parca('year'));
        const ay = Number(parca('month'));
        const gun = Number(parca('day'));
        const saat = Number(parca('hour'));
        const dakika = Number(parca('minute'));
        const saniye = Number(parca('second'));

        const gunBaslangici = Date.UTC(yil, ay - 1, gun);
        const gecenSaniye = saat * 3600 + dakika * 60 + saniye;
        const kalanSaniye = 86400 - gecenSaniye;

        // 4. Sonucu Redis'e kaydet
        await redisClient.set(cacheKey, JSON.stringify(sonuc), {
            EX: kalanSaniye
        });

        console.log(`[REDIS] Menü önbelleğe kaydedildi: ${cacheKey}`);

        return res.json(sonuc);

    } catch (error) {
        console.error("Menü getirme hatası:", error);
        return res.status(500).json({
            hata: "Sunucu hatası oluştu."
        });
    }
};


const haftalikMenu = async (req, res) => {
    const { tarih, rol } = req.query;

    if (!tarih || !rol) {
        return res.status(400).json({ hata: "Tarih ve kullanıcı rolü gereklidir." });
    }

    try {
        const satirlar = await Menu.haftalikMenuGetir(tarih);
        const suAn = new Date(); // Sistemin o anki saati

        const haftalikListe = satirlar.map(satir => {
            // İŞ KURALI 1: Rol bazlı fiyat belirleme (Arayüz düşünmez, API karar verir)
            const gecerliFiyat = (rol === 'personel' || rol === 'yonetici')
                ? satir.personel_fiyati
                : satir.ogrenci_fiyati;

            // İŞ KURALI 2: Son saat geçtiyse veya boş yer yoksa rezervasyon kapalıdır
            const sureDoldu = suAn > new Date(satir.rezervasyon_son);
            const yerYok = satir.bos_yer <= 0;
            const butonPasifMi = sureDoldu || yerYok;

            let pasifNedeni = null;
            if (sureDoldu) pasifNedeni = "Süre doldu";
            else if (yerYok) pasifNedeni = "Kontenjan dolu";

            return {
                menu_id: satir.menu_id,
                tarih: new Intl.DateTimeFormat('en-CA', {
                    timeZone: 'Europe/Istanbul',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }).format(satir.tarih),
                yemekhane: satir.yemekhane,
                ogun: satir.ogun,
                bos_yer: satir.bos_yer,
                rezervasyon_son: satir.rezervasyon_son,
                fiyat: gecerliFiyat, // Arayüze sadece tek bir 'fiyat' gidiyor
                rezervasyon_acik: !butonPasifMi,
                pasif_nedeni: pasifNedeni
            };
        });

        res.json(haftalikListe);

    } catch (error) {
        console.error("Haftalık menü hatası:", error);
        res.status(500).json({ hata: "Sunucu hatası oluştu." });
    }
};

// EXPORT SATIRINI ŞU ŞEKİLDE GÜNCELLE:
module.exports = { gunlukMenuDetay, haftalikMenu };