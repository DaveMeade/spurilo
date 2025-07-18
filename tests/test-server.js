import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting test server...');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// System status without MongoDB
app.get('/api/system/status', (req, res) => {
  res.json({ 
    hasAdminUser: false,
    isAuthenticated: false,
    user: null,
    message: 'Test server - no database connection'
  });
});

const server = http.createServer(app);
const PORT = 8000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on http://localhost:${PORT}/`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API test: http://localhost:${PORT}/api/test`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});