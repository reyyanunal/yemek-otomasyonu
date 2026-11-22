
const { dbRead, dbWrite } = require('../config/db');

// Sistemdeki tüm alerjenleri listele (replika)
const tumAlerjenler = async () => {
    const [rows] = await dbRead.execute(
        'SELECT id, ad FROM alerjenler ORDER BY id'
    );
    return rows;
};

// Kullanıcının seçtiği alerjenleri getir (replika)
const kullaniciAlerjenleri = async (kullanici_id) => {
    const [rows] = await dbRead.execute(
        `SELECT a.id, a.ad
         FROM kullanici_alerjenleri ka
         JOIN alerjenler a ON a.id = ka.alerjen_id
         WHERE ka.kullanici_id = ?
         ORDER BY a.id`,
        [kullanici_id]
    );
    return rows;
};

// Kullanıcının alerjen tercihlerini kaydet (kaynak)
const alerjenTercihleriniKaydet = async (kullanici_id, alerjen_idleri) => {
    const connection = await dbWrite.getConnection();

    try {
        await connection.beginTransaction();

        await connection.execute(
            'DELETE FROM kullanici_alerjenleri WHERE kullanici_id = ?',
            [kullanici_id]
        );

        for (const alerjen_id of alerjen_idleri) {
            await connection.execute(
                `INSERT INTO kullanici_alerjenleri
                 (kullanici_id, alerjen_id)
                 VALUES (?, ?)`,
                [kullanici_id, alerjen_id]
            );
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    tumAlerjenler,
    kullaniciAlerjenleri,
    alerjenTercihleriniKaydet
};
