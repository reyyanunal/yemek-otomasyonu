const bcrypt = require('bcryptjs');
const Kullanici = require('../models/kullaniciModel');

const girisYap = async (req, res) => {
    const { eposta, sifre } = req.body;

    try {
        const kullanici = await Kullanici.epostaIleGetir(eposta);

        if (!kullanici) {
            return res.status(401).json({ hata: "E-posta veya şifre hatalı." });
        }

        const sifreDogruMu = await bcrypt.compare(sifre, kullanici.sifre_hash);

        if (!sifreDogruMu) {
            return res.status(401).json({ hata: "E-posta veya şifre hatalı." });
        }

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