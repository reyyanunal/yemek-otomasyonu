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

const haftalikMenuGetir = async (baslangicTarihi) => {
    // 7 günlük menüyü getiriyoruz. Fiyatları almak için menuler tablosuyla JOIN yapıyoruz.
    const query = `
        SELECT d.*, m.ogrenci_fiyati, m.personel_fiyati 
        FROM v_menu_doluluk d
        JOIN menuler m ON d.menu_id = m.id
        WHERE d.tarih >= ? AND d.tarih <= DATE_ADD(?, INTERVAL 6 DAY)
        ORDER BY d.tarih, d.yemekhane_id, d.ogun_id
    `;
    const [rows] = await dbRead.execute(query, [baslangicTarihi, baslangicTarihi]);
    return rows;
};

// EXPORT SATIRINI ŞU ŞEKİLDE GÜNCELLE:
module.exports = { gunlukMenuGetir, haftalikMenuGetir };