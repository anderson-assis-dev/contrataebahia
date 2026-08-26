const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 53002;

app.use(compression());
app.use(express.static(path.join(__dirname, 'build'), { maxAge: '30d' }));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Contrataê Bahia rodando em http://localhost:${PORT}`);
});
