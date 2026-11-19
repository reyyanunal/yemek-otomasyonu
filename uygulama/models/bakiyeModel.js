const { dbRead, dbWrite } = require('../config/db');

const guncelBakiyeGetir = async (kullanici_id) => {
    const query = `SELECT bakiye FROM kullanicilar WHERE id = ?`;
    const [rows] = await dbRead.execute(query, [kullanici_id]);
    return rows[0] || null;
};

const hareketGecmisiGetir = async (kullanici_id) => {
    const query = `
        SELECT id AS hareket_id, tur, tutar, rezervasyon_id, aciklama, olusturma
        FROM bakiye_hareketleri
        WHERE kullanici_id = ?
        ORDER BY olusturma DESC, id DESC
    `;
    const [rows] = await dbRead.execute(query, [kullanici_id]);
    return rows;
};

const bakiyeYukle = async (kullanici_id, tutar) => {
    // Yazma işlemi olduğu için dbWrite (Primary) kullanıyoruz
    const query = `CALL sp_bakiye_yukle(?, ?)`;
    const [rows] = await dbWrite.execute(query, [kullanici_id, tutar]);

    if (rows && rows[0] && rows[0].length > 0) {
        return rows[0][0]; // hareket_id, bakiye
    }
    return null;
};

module.exports = {
    guncelBakiyeGetir,
    hareketGecmisiGetir,
    bakiyeYukle
};