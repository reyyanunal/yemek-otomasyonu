const { dbRead, dbWrite } = require('../config/db');

const yoneticiMi = async (kullanici_id) => {
    const query = `SELECT id FROM kullanicilar WHERE id = ? AND rol = 'yonetici' AND aktif = 1 LIMIT 1`;
    const [rows] = await dbRead.execute(query, [kullanici_id]);
    return rows.length > 0;
};

const menuOlustur = async ({ yemekhane_id, tarih, ogun_id, ogrenci_fiyati, personel_fiyati, yemek_idleri = [] }) => {
    const conn = await dbWrite.getConnection();
    try {
        await conn.beginTransaction();

        const [result] = await conn.execute(
            `INSERT INTO menuler (yemekhane_id, tarih, ogun_id, ogrenci_fiyati, personel_fiyati)
             VALUES (?, ?, ?, ?, ?)`,
            [yemekhane_id, tarih, ogun_id, ogrenci_fiyati, personel_fiyati]
        );
        const menuId = result.insertId;

        if (Array.isArray(yemek_idleri) && yemek_idleri.length > 0) {
            for (const yemekId of yemek_idleri) {
                await conn.execute(
                    `INSERT INTO menu_yemekleri (menu_id, yemek_id) VALUES (?, ?)`,
                    [menuId, yemekId]
                );
            }
        }

        await conn.commit();
        return menuId;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

const menuBilgisiGetir = async (menu_id) => {
    const [rows] = await dbWrite.execute(
        `SELECT id, yemekhane_id,
                DATE_FORMAT(tarih, '%Y-%m-%d') AS tarih,
                ogun_id
         FROM menuler
         WHERE id = ?`,
        [menu_id]
    );

    return rows[0] || null;
};


const menuDuzenle = async (menu_id, { yemekhane_id, tarih, ogun_id, ogrenci_fiyati, personel_fiyati, yemek_idleri }) => {
    const conn = await dbWrite.getConnection();
    try {
        await conn.beginTransaction();

        const [result] = await conn.execute(
            `UPDATE menuler
             SET yemekhane_id = ?, tarih = ?, ogun_id = ?, ogrenci_fiyati = ?, personel_fiyati = ?
             WHERE id = ?`,
            [yemekhane_id, tarih, ogun_id, ogrenci_fiyati, personel_fiyati, menu_id]
        );

        if (result.affectedRows === 0) {
            await conn.rollback();
            return false;
        }

        if (Array.isArray(yemek_idleri)) {
            await conn.execute(`DELETE FROM menu_yemekleri WHERE menu_id = ?`, [menu_id]);
            for (const yemekId of yemek_idleri) {
                await conn.execute(
                    `INSERT INTO menu_yemekleri (menu_id, yemek_id) VALUES (?, ?)`,
                    [menu_id, yemekId]
                );
            }
        }

        await conn.commit();
        return true;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

const menuIstatistikleriGetir = async () => {
    const query = `
        SELECT 
            d.menu_id,
            d.tarih,
            d.yemekhane,
            d.ogun,
            m.ogrenci_fiyati,
            m.personel_fiyati,
            d.kapasite,
            d.rezerve,
            d.bos_yer,
            d.doluluk_yuzde,
            COALESCE(p.oy_sayisi, 0) AS oy_sayisi,
            p.ortalama_puan
        FROM v_menu_doluluk d
        JOIN menuler m ON d.menu_id = m.id
        LEFT JOIN v_menu_puan p ON d.menu_id = p.menu_id
        ORDER BY d.tarih DESC, d.menu_id DESC
        LIMIT 20
    `;
    const [rows] = await dbRead.execute(query);
    return rows;
};

module.exports = {
    yoneticiMi,
    menuOlustur,
    menuDuzenle,
    menuBilgisiGetir,
    menuIstatistikleriGetir
};