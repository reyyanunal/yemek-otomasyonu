const express = require('express');
const app = express();
const port = 8000;

app.get('/api/test', (req, res) => {
  res.json({ mesaj: "Harika! Uygulama servisi ayakta ve basariyla calisiyor." });
});

app.listen(port, () => {
  console.log(`Uygulama ${port} portunda basladi`);
});