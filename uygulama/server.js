const express = require('express');
const app = express();
const port = 8000;

app.use(express.json());

const authRoutes = require('./routes/authRoutes');

app.get('/api/test', (req, res) => {
  res.json({ mesaj: "Harika! Uygulama servisi ayakta ve basariyla calisiyor." });
});

app.use('/api', authRoutes);



const menuRoutes = require('./routes/menuRoutes');

app.use('/api/menuler', menuRoutes);

const rezervasyonRoutes = require('./routes/rezervasyonRoutes');

app.use('/api/rezervasyonlar', rezervasyonRoutes);

const bakiyeRoutes = require('./routes/bakiyeRoutes');
app.use('/api/bakiye', bakiyeRoutes);

const degerlendirmeRoutes = require('./routes/degerlendirmeRoutes');
app.use('/api/degerlendirmeler', degerlendirmeRoutes);

const yoneticiRoutes = require('./routes/yoneticiRoutes');
app.use('/api/yonetici', yoneticiRoutes);

app.listen(port, () => {
  console.log(`Uygulama ${port} portunda basladi`);
});