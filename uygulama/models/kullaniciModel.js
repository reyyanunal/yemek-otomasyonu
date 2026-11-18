const { dbRead } = require('../config/db');

const epostaIleGetir = async (eposta) => {
    // Okuma işlemi olduğu için yönergeye uygun olarak dbRead (Replika) kullanıyoruz
    const [rows] = await dbRead.execute('SELECT * FROM kullanicilar WHERE eposta = ?', [eposta]);
    return rows[0]; // Eşleşen kullanıcıyı döndür
};

module.exports = { epostaIleGetir };