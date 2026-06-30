const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { setupSwagger } = require('./config/swagger');
const { errorHandler } = require('./middleware/error');
const { apiLimiter } = require('./middleware/rateLimit');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const modelRoutes = require('./routes/model.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const movementRoutes = require('./routes/movement.routes');
const inboundRoutes = require('./routes/inbound.routes');
const outboundRoutes = require('./routes/outbound.routes');
const warehouseRoutes = require('./routes/warehouse.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const searchRoutes = require('./routes/search.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/movements', movementRoutes);
app.use('/api/inbound', inboundRoutes);
app.use('/api/outbound', outboundRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);

setupSwagger(app);

app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use(errorHandler);

module.exports = app;
