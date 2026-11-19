const express = require('express');
const app = express();
const port = 8000;

// Gelen JSON formatındaki verileri (eposta, sifre) okuyabilmek için şart!
app.use(express.json());

// Yazdığımız route dosyasını içeri aktarıyoruz
const authRoutes = require('./routes/authRoutes');

// Test endpoint'imiz aynen kalsın
app.get('/api/test', (req, res) => {
  res.json({ mesaj: "Harika! Uygulama servisi ayakta ve basariyla calisiyor." });
});

// /api ile başlayan tüm istekleri (örneğin /api/giris) authRoutes'a yönlendiriyoruz
app.use('/api', authRoutes);

app.listen(port, () => {
  console.log(`Uygulama ${port} portunda basladi`);
});

// İçeri aktar:
const menuRoutes = require('./routes/menuRoutes');

// Rotaları kullan (app.use('/api', authRoutes); satırının hemen altına ekle):
app.use('/api/menuler', menuRoutes);

// İçeri aktar:
const rezervasyonRoutes = require('./routes/rezervasyonRoutes');

// Rotaları kullan (app.use('/api/menuler', ... satırının hemen altına ekle):
app.use('/api/rezervasyonlar', rezervasyonRoutes);

const bakiyeRoutes = require('./routes/bakiyeRoutes');
// ...
app.use('/api/bakiye', bakiyeRoutes);

const degerlendirmeRoutes = require('./routes/degerlendirmeRoutes');
// ...
app.use('/api/degerlendirmeler', degerlendirmeRoutes);