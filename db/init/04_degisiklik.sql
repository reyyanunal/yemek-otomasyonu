
-- AŞAMA 4: VERİTABANI DEĞİŞİKLİĞİ

-- 1. Rezervasyonlara porsiyon seçimi eklenmesi
ALTER TABLE rezervasyonlar
ADD COLUMN porsiyon ENUM('tam', 'yarim')
NOT NULL DEFAULT 'tam';

-- 2. Kullanıcıların alerjen tercihlerinin saklanması
CREATE TABLE kullanici_alerjenleri (
    kullanici_id INT UNSIGNED NOT NULL,
    alerjen_id TINYINT UNSIGNED NOT NULL,

    PRIMARY KEY (kullanici_id, alerjen_id),

    CONSTRAINT fk_ka_kullanici
        FOREIGN KEY (kullanici_id)
        REFERENCES kullanicilar(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ka_alerjen
        FOREIGN KEY (alerjen_id)
        REFERENCES alerjenler(id)
);

-- 3. Rezervasyon prosedürünün porsiyon desteğiyle güncellenmesi

DROP PROCEDURE IF EXISTS sp_rezervasyon_yap;

DELIMITER $$

CREATE PROCEDURE sp_rezervasyon_yap(
    IN p_kullanici_id INT UNSIGNED,
    IN p_menu_id INT UNSIGNED,
    IN p_porsiyon VARCHAR(10)
)
BEGIN
    DECLARE v_rol VARCHAR(10) DEFAULT NULL;
    DECLARE v_aktif TINYINT DEFAULT NULL;
    DECLARE v_bakiye DECIMAL(10,2) DEFAULT NULL;
    DECLARE v_son DATETIME DEFAULT NULL;
    DECLARE v_kapasite INT DEFAULT NULL;
    DECLARE v_ogun_id TINYINT UNSIGNED DEFAULT NULL;
    DECLARE v_ogr_fiyat DECIMAL(8,2) DEFAULT NULL;
    DECLARE v_per_fiyat DECIMAL(8,2) DEFAULT NULL;
    DECLARE v_ucret DECIMAL(8,2) DEFAULT NULL;
    DECLARE v_dolu INT DEFAULT 0;
    DECLARE v_mevcut_id INT UNSIGNED DEFAULT NULL;
    DECLARE v_mevcut_durum VARCHAR(12) DEFAULT NULL;
    DECLARE v_rez_id INT UNSIGNED DEFAULT NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    DECLARE CONTINUE HANDLER FOR NOT FOUND BEGIN END;

    START TRANSACTION;

    -- Porsiyon seçimini doğrula
    IF p_porsiyon IS NULL OR p_porsiyon NOT IN ('tam', 'yarim') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Geçersiz porsiyon seçimi.';
    END IF;

    -- Kullanıcı ve bakiye kontrolü
    SELECT rol, aktif, bakiye
    INTO v_rol, v_aktif, v_bakiye
    FROM kullanicilar
    WHERE id = p_kullanici_id
    FOR UPDATE;

    IF v_rol IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Kullanıcı bulunamadı.';
    END IF;

    IF v_aktif = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Hesabınız pasif durumda.';
    END IF;

    -- Menü, öğün, fiyat ve kapasite bilgileri
    SELECT
        TIMESTAMP(m.tarih, o.son_saat),
        yh.kapasite,
        m.ogun_id,
        m.ogrenci_fiyati,
        m.personel_fiyati
    INTO
        v_son,
        v_kapasite,
        v_ogun_id,
        v_ogr_fiyat,
        v_per_fiyat
    FROM menuler m
    JOIN ogunler o ON o.id = m.ogun_id
    JOIN yemekhaneler yh ON yh.id = m.yemekhane_id
    WHERE m.id = p_menu_id
    FOR UPDATE;

    IF v_son IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Menü bulunamadı.';
    END IF;

    IF NOW() >= v_son THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Bu menü için rezervasyon süresi doldu.';
    END IF;

    -- Kahvaltıda yarım porsiyon yasak
    IF v_ogun_id = 1 AND p_porsiyon = 'yarim' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Kahvaltıda yarım porsiyon seçilemez.';
    END IF;

    -- Önceki rezervasyon kontrolü
    SELECT id, durum
    INTO v_mevcut_id, v_mevcut_durum
    FROM rezervasyonlar
    WHERE kullanici_id = p_kullanici_id
      AND menu_id = p_menu_id
    FOR UPDATE;

    IF v_mevcut_durum IN ('aktif', 'kullanildi') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Bu menü için zaten rezervasyonunuz var.';
    END IF;

    -- Kapasite kontrolü
    SELECT COUNT(*)
    INTO v_dolu
    FROM rezervasyonlar
    WHERE menu_id = p_menu_id
      AND durum IN ('aktif', 'kullanildi');

    IF v_dolu >= v_kapasite THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Yemekhane kapasitesi dolu.';
    END IF;

    -- Kullanıcı rolüne göre tam fiyat
    SET v_ucret = IF(
        v_rol = 'ogrenci',
        v_ogr_fiyat,
        v_per_fiyat
    );

    -- Yarım porsiyon: tam fiyatın %60'ı
    IF p_porsiyon = 'yarim' THEN
        SET v_ucret = ROUND(v_ucret * 0.60, 2);
    END IF;

    IF v_bakiye < v_ucret THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Bakiye yetersiz.';
    END IF;

    -- Rezervasyon oluşturma veya iptal edilmiş kaydı yenileme
    IF v_mevcut_id IS NULL THEN

        INSERT INTO rezervasyonlar
            (kullanici_id, menu_id, durum, ucret, porsiyon)
        VALUES
            (p_kullanici_id, p_menu_id, 'aktif', v_ucret, p_porsiyon);

        SET v_rez_id = LAST_INSERT_ID();

    ELSE

        UPDATE rezervasyonlar
        SET durum = 'aktif',
            ucret = v_ucret,
            porsiyon = p_porsiyon,
            olusturma = NOW(),
            iptal_zamani = NULL,
            kullanma_zamani = NULL
        WHERE id = v_mevcut_id;

        SET v_rez_id = v_mevcut_id;

    END IF;

    -- Bakiye ve hareket kaydı
    UPDATE kullanicilar
    SET bakiye = bakiye - v_ucret
    WHERE id = p_kullanici_id;

    INSERT INTO bakiye_hareketleri
        (kullanici_id, tur, tutar, rezervasyon_id, aciklama)
    VALUES
        (p_kullanici_id, 'rezervasyon', -v_ucret, v_rez_id, 'Rezervasyon');

    COMMIT;

    SELECT
        v_rez_id AS rezervasyon_id,
        v_ucret AS ucret,
        v_bakiye - v_ucret AS bakiye;
END$$

DELIMITER ;
