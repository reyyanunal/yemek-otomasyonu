const { dbRead, dbWrite } = require('../config/db');

const kullaniciRezervasyonlariniGetir = async (kullanici_id) => {
    const query = `
        SELECT r.id AS rezervasyon_id, r.durum, r.ucret, r.olusturma, 
               m.tarih, m.ogun, m.yemekhane, m.rezervasyon_son 
        FROM rezervasyonlar r
        JOIN v_menu_doluluk m ON r.menu_id = m.menu_id
        WHERE r.kullanici_id = ?
        ORDER BY m.tarih DESC, m.ogun_id ASC
    `;
    const [rows] = await dbRead.execute(query, [kullanici_id]);
    return rows;
};

const rezervasyonYap = async (kullanici_id, menu_id) => {
    // KURAL: Yazma işlemi olduğu için dbWrite (Primary) kullanıyoruz!
    const query = `CALL sp_rezervasyon_yap(?, ?)`;
    const [rows] = await dbWrite.execute(query, [kullanici_id, menu_id]);

    if (rows && rows[0] && rows[0].length > 0) {
        return rows[0][0]; // Stored Procedure'den dönen: rezervasyon_id, ucret, bakiye
    }
    return null;
};

const rezervasyonIptalEt = async (kullanici_id, rezervasyon_id) => {
    // Yazma/iade işlemi olduğu için dbWrite (Primary) kullanıyoruz
    const query = `CALL sp_rezervasyon_iptal(?, ?)`;
    const [rows] = await dbWrite.execute(query, [kullanici_id, rezervasyon_id]);

    if (rows && rows[0] && rows[0].length > 0) {
        return rows[0][0]; // rezervasyon_id, iade, bakiye
    }
    return null;
};

module.exports = { kullaniciRezervasyonlariniGetir, rezervasyonYap, rezervasyonIptalEt};