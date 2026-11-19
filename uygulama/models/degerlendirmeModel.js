const { dbRead, dbWrite } = require('../config/db');

const kullanilmisRezervasyonVarMi = async (kullanici_id, menu_id) => {
    const query = `
        SELECT id 
        FROM rezervasyonlar 
        WHERE kullanici_id = ? AND menu_id = ? AND durum = 'kullanildi'
        LIMIT 1
    `;
    const [rows] = await dbRead.execute(query, [kullanici_id, menu_id]);
    return rows.length > 0;
};

const dahaOnceDegerlendirmisMi = async (kullanici_id, menu_id) => {
    const query = `
        SELECT id 
        FROM degerlendirmeler 
        WHERE kullanici_id = ? AND menu_id = ?
        LIMIT 1
    `;
    const [rows] = await dbRead.execute(query, [kullanici_id, menu_id]);
    return rows.length > 0;
};

const degerlendirmeEkle = async (kullanici_id, menu_id, puan, yorum) => {
    // Yazma işlemi olduğu için dbWrite (Primary) kullanıyoruz
    const query = `
        INSERT INTO degerlendirmeler (kullanici_id, menu_id, puan, yorum)
        VALUES (?, ?, ?, ?)
    `;
    const [result] = await dbWrite.execute(query, [kullanici_id, menu_id, puan, yorum || null]);
    return result.insertId;
};

const menuPuanOzetiGetir = async (menu_id) => {
    const query = `SELECT menu_id, oy_sayisi, ortalama_puan FROM v_menu_puan WHERE menu_id = ?`;
    const [rows] = await dbRead.execute(query, [menu_id]);
    return rows[0] || { menu_id: Number(menu_id), oy_sayisi: 0, ortalama_puan: null };
};

const menuYorumlariniGetir = async (menu_id) => {
    const query = `
        SELECT d.id, d.kullanici_id, CONCAT(k.ad, ' ', k.soyad) AS kullanici_adi, d.puan, d.yorum, d.olusturma
        FROM degerlendirmeler d
        JOIN kullanicilar k ON d.kullanici_id = k.id
        WHERE d.menu_id = ?
        ORDER BY d.olusturma DESC
    `;
    const [rows] = await dbRead.execute(query, [menu_id]);
    return rows;
};

module.exports = {
    kullanilmisRezervasyonVarMi,
    dahaOnceDegerlendirmisMi,
    degerlendirmeEkle,
    menuPuanOzetiGetir,
    menuYorumlariniGetir
};