'use strict';
const express = require('express');
const config = require('./config/env');
const { helmetMiddleware, corsMiddleware, sanitizeInput, apiLimiter } = require('./middleware/security');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const publicController = require('./controllers/publicController');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  // Behind Render / Vercel proxies the real client IP is needed for rate limiting & audit logs.
  app.set('trust proxy', config.trustProxy === 'false' ? false : (Number.isNaN(Number(config.trustProxy)) ? config.trustProxy : Number(config.trustProxy)));

  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(sanitizeInput);

  app.get('/', (_req, res) => res.json({ success: true, service: 'ElexGuard API', docs: '/api/health' }));
  app.get('/api/health', publicController.health);
  app.get('/api/candidates/:id/photo', publicController.candidatePhoto);

  app.use('/api', apiLimiter);
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/public', require('./routes/publicRoutes'));
  app.use('/api/voter', require('./routes/voterRoutes'));
  app.use('/api/admin', require('./routes/adminRoutes'));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
