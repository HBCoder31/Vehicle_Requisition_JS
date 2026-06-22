require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
// const morgan = require('morgan');

const { testConnection } = require('./config/db');
require('./config/passport');
const logger = require('./utils/logger');
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./middleware/errorHandler');
// const swaggerDocs = require('./utils/swagger');
const path = require('path');
const http = require('http');
const socketUtil = require('./utils/socket');

// ─── Express App & Server ──────────────────────────────────
const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ───────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// CORS — allow the React dev server
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // allow cookies to be sent cross-origin
}));

// Simple in-memory rate limiting
const ipHits = {};
setInterval(() => { for(let k in ipHits) delete ipHits[k]; }, 15 * 60 * 1000);

app.use('/api/', (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  ipHits[ip] = (ipHits[ip] || 0) + 1;
  if (ipHits[ip] > 5000) {
    return res.status(429).json({ error: 'Too many requests, please try again later.' });
  }
  next();
});

// ─── Body Parsing & Cookies ───────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ─── Logging ───────────────────────────────────────────────
// if (process.env.NODE_ENV !== 'production') {
//   app.use(morgan('dev'));
// } else {
//   // Use Morgan with Winston in production
//   app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
// }

// ─── Passport Initialization ──────────────────────────────
app.use(passport.initialize());

// ─── API Documentation ────────────────────────────────────
// swaggerDocs(app);

// ─── Health Check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Static Files ──────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize SSE
socketUtil.init(app);

// ─── API Routes ────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/requests',    require('./routes/requests'));
app.use('/api/approvals',   require('./routes/approvals'));
app.use('/api/garage',      require('./routes/garage'));
app.use('/api/admin',       require('./routes/admin'));
app.use('/api/drivers',       require('./routes/drivers'));
app.use('/api/maintenance',   require('./routes/maintenance'));
app.use('/api/fuel',          require('./routes/fuel'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/feedback',      require('./routes/feedback'));
app.use('/api/attachments',   require('./routes/attachments'));
app.use('/api/analytics',     require('./routes/analytics'));
app.use('/api/search',        require('./routes/search'));
app.use('/api/delegations',   require('./routes/delegations'));
app.use('/api/destinations',  require('./routes/destinations'));

// ─── 404 Handler ───────────────────────────────────────────
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// ─── Global Error Handler ──────────────────────────────────
app.use(globalErrorHandler);

// ─── Start Server ──────────────────────────────────────────
async function start() {
  // Verify database connectivity
  await testConnection();

  server.listen(PORT, () => {
    logger.info(`🚀 Vehicle Requisition Portal API started on port ${PORT} in ${process.env.NODE_ENV} mode`);
    logger.info(`📚 Swagger Docs available at http://localhost:${PORT}/api-docs`);
  });
}

start();

module.exports = app;
