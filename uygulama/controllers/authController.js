const bcrypt = require('bcryptjs');
const Kullanici = require('../models/kullaniciModel');

const girisYap = async (req, res) => {
    const { eposta, sifre } = req.body;

    try {
        // 1. Model üzerinden kullanıcıyı veritabanından bul
        const kullanici = await Kullanici.epostaIleGetir(eposta);

        if (!kullanici) {
            return res.status(401).json({ hata: "E-posta veya şifre hatalı." });
        }

        // 2. Yönergedeki "bcrypt doğrulaması" kuralı
        const sifreDogruMu = await bcrypt.compare(sifre, kullanici.sifre);

        if (!sifreDogruMu) {
            return res.status(401).json({ hata: "E-posta veya şifre hatalı." });
        }

        // 3. Doğrulama başarılıysa bilgileri döndür
        res.json({
            mesaj: "Giriş başarılı!",
            kullanici: {
                id: kullanici.id,
                ad: kullanici.ad,
                soyad: kullanici.soyad,
                rol: kullanici.rol,
                bakiye: kullanici.bakiye
            }
        });

    } catch (error) {
        console.error("Giriş işlemi sırasında hata:", error);
        res.status(500).json({ hata: "Sunucu hatası oluştu." });
    }
};

module.exports = { girisYap };