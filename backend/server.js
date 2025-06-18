const express = require('express');
// const cors = require('cors'); // Removed - CORS handled by API Gateway
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
// CORS disabled - handled by API Gateway
// app.use(cors({
//   origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:3000'],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
// }));
app.use(morgan('combined'));

// Timeout middleware
app.use((req, res, next) => {
  req.setTimeout(15000, () => {
    console.log('Request timeout for:', req.method, req.url);
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
switch (process.env.SERVICE) {
  case 'patients':
    app.use('/patients', require('./routes/patients'));
    break;
  case 'doctors':
    app.use('/doctors', require('./routes/doctors'));
    break;
  case 'appointments':
    app.use('/appointments', require('./routes/appointments'));
    break;
  case 'alive':
    app.use('/alive', require('./routes/alive'));
    break;
  default:
    console.error('No service specified in environment variables. Please set SERVICE to one of: patients, doctors, appointments, alive.');
    process.exit(1);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
