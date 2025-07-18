import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__dirname);

console.log('Starting Spurilo server...');
console.log('MongoDB URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/spurilo');

// --- Main Spurilo Application ---
const spuriloApp = express();

// Basic middleware
spuriloApp.use(express.json());
spuriloApp.use(express.urlencoded({ extended: true }));

// Session configuration (without MongoDB store for now)
spuriloApp.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-this',
  resave: false,
  saveUninitialized: false,
  // Temporarily disable MongoDB store to test if that's the issue
  // store: MongoStore.create({
  //   mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/spurilo',
  //   touchAfter: 24 * 3600
  // }),
  cookie: {
    secure: false, // Set to false for development
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// Simple API Routes (without MongoDB dependencies)
spuriloApp.get('/api/system/status', async (req, res) => {
  res.json({ 
    hasAdminUser: false,
    isAuthenticated: false,
    user: null,
    message: 'Server running in simple mode'
  });
});

spuriloApp.get('/api/health/mongo', (req, res) => {
  res.json({ 
    connected: false,
    lastCheck: new Date().toISOString(),
    message: 'MongoDB connection disabled in simple mode'
  });
});

spuriloApp.post('/api/users', (req, res) => {
  console.log('Creating user (simple mode):', req.body);
  res.json({ 
    userId: `user-${Date.now()}`,
    ...req.body,
    createdDate: new Date().toISOString(),
    message: 'User created in simple mode (not persisted)'
  });
});

spuriloApp.get('/api/engagements', (req, res) => {
  const sampleEngagements = [
    {
      id: 'eng-001',
      name: 'Acme Corp Gap Assessment',
      engagementType: 'gap-assessment',
      customerName: 'Acme Corporation',
      consultant: 'Jane Auditor',
      framework: 'NIST',
      status: 'in-progress',
      priority: 'high',
      scope: 'Information Security Controls Assessment',
      notes: 'Initial gap assessment for NIST compliance',
      createdDate: '2024-01-15T00:00:00.000Z'
    }
  ];
  res.json(sampleEngagements);
});

spuriloApp.post('/api/engagements', (req, res) => {
  console.log('Creating engagement (simple mode):', req.body);
  const newEngagement = {
    id: `eng-${Date.now()}`,
    ...req.body,
    status: 'planning',
    createdDate: new Date().toISOString()
  };
  res.json(newEngagement);
});

// Serve static files from the "public" directory
spuriloApp.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
spuriloApp.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// For production: serve the React app for all non-API routes
if (process.env.NODE_ENV === 'production') {
  spuriloApp.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

const spuriloServer = http.createServer(spuriloApp);

spuriloServer.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

spuriloServer.listen(8000, '0.0.0.0', () => {
  console.log('✅ Spurilo API server (simple mode) running on http://localhost:8000/');
  console.log('📊 Health check: http://localhost:8000/health');
  console.log('🔧 System status: http://localhost:8000/api/system/status');
  console.log('⚠️  Running in simple mode - MongoDB and OAuth disabled for testing');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  spuriloServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  spuriloServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});