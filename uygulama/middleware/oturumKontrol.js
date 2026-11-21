
const { redisClient } = require('../config/redis');

const OTURUM_SURESI = 1800;

const oturumKontrol = async (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({
            hata: 'Oturum açmanız gerekiyor.'
        });
    }

    const token = authorization.slice(7).trim();

    if (!/^[a-f0-9]{64}$/.test(token)) {
        return res.status(401).json({
            hata: 'Geçersiz oturum anahtarı.'
        });
    }

    try {
        const anahtar = `oturum:${token}`;
        const oturum = await redisClient.get(anahtar);

        if (!oturum) {
            return res.status(401).json({
                hata: 'Oturum süresi dolmuş veya çıkış yapılmış.'
            });
        }

        const kullanici = JSON.parse(oturum);

        // İstekteki kullanıcı bilgilerini değil, Redis'teki kimliği kullan
        req.kullanici = kullanici;
        req.token = token;

        // Her başarılı doğrulamada TTL'yi 30 dakikaya yenile
        await redisClient.expire(anahtar, OTURUM_SURESI);

        next();

    } catch (error) {
        console.error('Oturum doğrulama hatası:', error);
        return res.status(500).json({
            hata: 'Oturum kontrolü sırasında sunucu hatası oluştu.'
        });
    }
};

module.exports = { oturumKontrol };
