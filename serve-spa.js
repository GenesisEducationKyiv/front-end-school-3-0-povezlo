const express = require('express');
const path = require('path');
const app = express();

// Обслуживание статических файлов
app.use(express.static(path.join(__dirname, 'dist/music-tracks-app')));

// Обработка всех маршрутов - возвращаем index.html для SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/music-tracks-app/index.html'));
});

const port = process.env.PORT || 4200;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
}); 