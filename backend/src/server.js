const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Initialize MongoDB connection
connectDB();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Serve static uploaded files (resumes, logos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Placeonix Placement Portal API is operational',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/recruiter', require('./routes/recruiterRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Public/Shared drives route
const { getDrives } = require('./controllers/adminController');
const { protect } = require('./middleware/auth');
app.get('/api/drives', protect, getDrives);
app.get('/api/student/drives', protect, getDrives);

// Serve static frontend files
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// Clean URL routing for dashboards
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/student-dashboard', (req, res) => {
  res.sendFile(path.join(frontendPath, 'student-dashboard.html'));
});

app.get('/recruiter-dashboard', (req, res) => {
  res.sendFile(path.join(frontendPath, 'recruiter-dashboard.html'));
});

app.get('/admin-dashboard', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin-dashboard.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(frontendPath, 'signup.html'));
});

// 404 Route handler for API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`,
  });
});

// Catch-all route to serve index.html for any other frontend navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const os = require('os');
function getLocalNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const networkIp = getLocalNetworkIp();

const server = app.listen(PORT, HOST, () => {
  console.log(`
  =======================================================
  🚀 Placeonix API & Web Server is running globally!
  📡 Environment: ${process.env.NODE_ENV || 'development'}
  
  🏠 Local URL:    http://localhost:${PORT}
  📱 Network URL:  http://${networkIp}:${PORT}
  🔗 Health Check: http://localhost:${PORT}/api/health
  =======================================================
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});
