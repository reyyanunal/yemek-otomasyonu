const { dbRead } = require('../config/db');

const gunlukMenuGetir = async (tarih, yemekhane_id, ogun_id) => {
    // Yönergedeki "Sıralama: ORDER BY kategori_sira, yemek" kuralı eklendi
    const query = `
        SELECT * FROM v_menu_detay 
        WHERE tarih = ? AND yemekhane_id = ? AND ogun_id = ?
        ORDER BY kategori_sira, yemek
    `;
    const [rows] = await dbRead.execute(query, [tarih, yemekhane_id, ogun_id]);
    return rows;
};

module.exports = { gunlukMenuGetir };