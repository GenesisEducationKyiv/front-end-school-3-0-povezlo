const express = require('express');
const path = require('path');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

// Включаем сжатие для всех ответов
app.use(compression({
  level: 6, // Уровень сжатия (1-9)
  threshold: 1024, // Минимальный размер файла для сжатия (в байтах)
  filter: (req, res) => {
    // Сжимаем только если клиент поддерживает и это не уже сжатый контент
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Проксирование API запросов к серверу
const API_SERVER_URL = process.env.API_SERVER_URL || 'http://localhost:8000';
app.use('/api', createProxyMiddleware({
  target: API_SERVER_URL,
  changeOrigin: true,
  logLevel: 'silent',
  secure: false,
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Proxy error' });
    }
  }
}));

// Проксирование GraphQL запросов
app.use('/graphql', createProxyMiddleware({
  target: API_SERVER_URL,
  changeOrigin: true,
  logLevel: 'silent',
  secure: false,
  onError: (err, req, res) => {
    console.error('GraphQL proxy error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'GraphQL proxy error' });
    }
  }
}));

// Обслуживание статических файлов
app.use(express.static(path.join(__dirname, 'dist/music-tracks-app'), {
  maxAge: '1y', // Кэширование статических файлов на год
  etag: true,
  lastModified: true
}));

// Обработка всех маршрутов - возвращаем index.html для SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/music-tracks-app/index.html'));
});

const port = process.env.PORT || 4200;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
}); 