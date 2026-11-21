
const bcrypt = require('bcryptjs');
const { randomBytes } = require('node:crypto');

const Kullanici = require('../models/kullaniciModel');
const { redisClient } = require('../config/redis');

const OTURUM_SURESI = 1800;

const girisYap = async (req, res) => {
    const { eposta, sifre } = req.body;

    if (typeof eposta !== 'string' || typeof sifre !== 'string') {
        return res.status(400).json({
            hata: "E-posta ve şifre gereklidir."
        });
    }

    try {
        const kullanici = await Kullanici.epostaIleGetir(eposta);

        if (!kullanici) {
            return res.status(401).json({
                hata: "E-posta veya şifre hatalı."
            });
        }

        const sifreDogruMu = await bcrypt.compare(
            sifre,
            kullanici.sifre_hash
        );

        if (!sifreDogruMu) {
            return res.status(401).json({
                hata: "E-posta veya şifre hatalı."
            });
        }

        // Güvenli ve rastgele oturum token'ı oluştur
        const token = randomBytes(32).toString('hex');

        // Oturumu Redis'e 30 dakikalığına kaydet
        await redisClient.set(
            `oturum:${token}`,
            JSON.stringify({
                kullanici_id: kullanici.id,
                rol: kullanici.rol
            }),
            { EX: OTURUM_SURESI }
        );

        console.log(`[REDIS] Kullanıcı ${kullanici.id} için oturum oluşturuldu.`);

        return res.json({
            mesaj: "Giriş başarılı!",
            token,
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

        return res.status(500).json({
            hata: "Sunucu hatası oluştu."
        });
    }
};


const cikisYap = async (req, res) => {
    try {
        await redisClient.del(`oturum:${req.token}`);

        console.log(
            `[REDIS] Kullanıcı ${req.kullanici.kullanici_id} oturumu silindi.`
        );

        return res.json({
            mesaj: 'Çıkış başarılı. Oturum sonlandırıldı.'
        });
    } catch (error) {
        console.error('Çıkış işlemi hatası:', error);

        return res.status(500).json({
            hata: 'Çıkış işlemi sırasında sunucu hatası oluştu.'
        });
    }
};

module.exports = { girisYap, cikisYap };
