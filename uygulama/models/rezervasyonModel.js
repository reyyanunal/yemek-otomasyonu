const { dbRead } = require('../config/db');

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

module.exports = { kullaniciRezervasyonlariniGetir };