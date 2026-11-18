const mysql = require('mysql2/promise');

// Yazma işlemleri için kaynak (Primary) sunucu bağlantısı
const dbWrite = mysql.createPool({
    host: process.env.DB_YAZMA_HOST || 'mysql-primary',
    user: process.env.DB_KULLANICI || 'yemekhane_app',
    password: process.env.DB_SIFRE || 'Uyg_2026',
    database: process.env.DB_ADI || 'yemekhane',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Okuma (Listeleme/Rapor) işlemleri için yedek (Replica) sunucu bağlantısı
const dbRead = mysql.createPool({
    host: process.env.DB_OKUMA_HOST || 'mysql-replica',
    user: process.env.DB_KULLANICI || 'yemekhane_app',
    password: process.env.DB_SIFRE || 'Uyg_2026',
    database: process.env.DB_ADI || 'yemekhane',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = { dbWrite, dbRead };