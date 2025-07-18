import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { configurePassport } from '../config/passport-config.js';
import authRoutes, { requireAuth } from './auth/auth-routes.js';
import passport from 'passport';

// Load environment variables
dotenv.config();
console.log('Environment variables loaded');
console.log('MONGODB_URI from env:', process.env.MONGODB_URI ? 'Set' : 'Not set');

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Main Spurilo Application ---
const spuriloApp = express();

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://root:example@localhost:27017/spurilo?authSource=admin';
console.log('Attempting to connect to MongoDB:', mongoUri.replace(///[^:]+:[^@]+@/, '//***:***@'));

mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
}).then(() => {
    console.log('✅ Connected to MongoDB');
    console.log('MongoDB connection state:', mongoose.connection.readyState);
}).catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    console.error('Full error:', error);
    if (error.message.includes('ECONNREFUSED')) {
        console.error('\n⚠️  MongoDB is not running. Please run: docker compose -f ./docker/docker-compose.yml up -d');
    } else if (error.message.includes('Authentication failed')) {
        console.error('\n⚠️  MongoDB authentication failed. Check credentials.');
        console.error('Using URI:', mongoUri.replace(///[^:]+:[^@]+@/, '//***:***@'));
    }
});

// CORS configuration for development
spuriloApp.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Middleware
spuriloApp.use(express.json());
spuriloApp.use(express.urlencoded({ extended: true }));

// Session configuration (using memory store temporarily due to MongoDB permissions issue)
spuriloApp.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-this',
  resave: false,
  saveUninitialized: false,
  // TODO: Fix MongoDB permissions for session store
  // store: MongoStore.create({
  //   mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/spurilo',
  //   touchAfter: 24 * 3600,
  //   connectTimeoutMS: 5000,
  //   socketTimeoutMS: 5000
  // }),
  cookie: {
    secure: false, // Set to false for development
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));
console.log('✅ Session middleware configured (memory store)');

// Initialize Passport
try {
  configurePassport();
  spuriloApp.use(passport.initialize());
  spuriloApp.use(passport.session());
  console.log('✅ Passport configured');
} catch (error) {
  console.warn('⚠️  Passport configuration failed:', error.message);
}

// Authentication routes
spuriloApp.use('/auth', authRoutes);
console.log('✅ Authentication routes configured');

// API Routes
spuriloApp.get('/api/system/status', async (req, res) => {
  try {
    // Check if any admin users exist
    console.log('System status check - importing userRoleHelpers...');
    const { userRoleHelpers } = await import('./UserRole/UserRoleHelpers.js');
    
    console.log('System status check - checking if helpers initialized...');
    if (!userRoleHelpers.initialized) {
      console.log('System status check - helpers not initialized, initializing...');
      await userRoleHelpers.initialize();
    }
    
    console.log('System status check - getting admin users...');
    // Add timeout to prevent hanging
    const adminUsersPromise = userRoleHelpers.getUsersByRole('admin');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 5000)
    );
    
    const adminUsers = await Promise.race([adminUsersPromise, timeoutPromise]);
    console.log('System status check - found', adminUsers.length, 'admin users');
    
    res.json({ 
      hasAdminUser: adminUsers.length > 0,
      isAuthenticated: req.isAuthenticated(),
      user: req.isAuthenticated() ? req.user : null
    });
  } catch (error) {
    console.error('Error checking system status:', error.message);
    console.error('Full error:', error);
    console.error('Mongoose connection state:', mongoose.connection.readyState);
    console.error('Mongoose connection states: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting');
    res.json({ 
      hasAdminUser: false,
      isAuthenticated: false,
      user: null,
      error: 'Database connection issue',
      details: error.message,
      mongoState: mongoose.connection.readyState
    });
  }
});

// Raw MongoDB connection test
spuriloApp.get('/api/test/raw-mongo', async (req, res) => {
  const { MongoClient } = await import('mongodb');
  const uri = process.env.MONGODB_URI || 'mongodb://root:example@localhost:27017/spurilo?authSource=admin';
  
  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000
    });
    
    await client.connect();
    const db = client.db();
    const collections = await db.listCollections().toArray();
    await client.close();
    
    res.json({
      success: true,
      database: db.databaseName,
      collections: collections.map(c => c.name),
      uri: uri.replace(///[^:]+:[^@]+@/, '//***:***@')
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      codeName: error.codeName
    });
  }
});

// Simple MongoDB test endpoint
spuriloApp.get('/api/test/mongo', async (req, res) => {
  try {
    const state = mongoose.connection.readyState;
    const stateText = ['disconnected', 'connected', 'connecting', 'disconnecting'][state];
    
    if (state === 1) {
      // Try a simple database operation
      const collections = await mongoose.connection.db.listCollections().toArray();
      res.json({
        status: 'connected',
        state: state,
        stateText: stateText,
        database: mongoose.connection.db.databaseName,
        collections: collections.map(c => c.name),
        uri: mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') // Hide credentials
      });
    } else {
      res.status(503).json({
        status: 'not connected',
        state: state,
        stateText: stateText,
        error: 'MongoDB is not connected'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      stack: error.stack
    });
  }
});

spuriloApp.get('/api/health/mongo', async (req, res) => {
  try {
    const mongoose = (await import('mongoose')).default;
    const isConnected = mongoose.connection.readyState === 1;
    
    res.json({ 
      connected: isConnected,
      readyState: mongoose.connection.readyState,
      readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
      lastCheck: new Date().toISOString()
    });
  } catch (error) {
    res.json({ 
      connected: false,
      error: error.message,
      lastCheck: new Date().toISOString()
    });
  }
});

spuriloApp.post('/api/users', async (req, res) => {
  try {
    console.log('POST /api/users - Request received:', req.body);
    
    // Check MongoDB connection first
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected. State:', mongoose.connection.readyState);
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'MongoDB is not connected. Please ensure the database is running.',
        mongoState: mongoose.connection.readyState
      });
    }
    
    const { userRoleHelpers } = await import('./UserRole/UserRoleHelpers.js');
    const userData = {
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      organization: req.body.organization || 'Default Organization',
      title: req.body.title || '',
      roles: req.body.roles || ['admin'], // Legacy field for compatibility
      system_roles: req.body.system_roles || (req.body.roles?.includes('admin') ? ['admin'] : []),
      organization_roles: req.body.organization_roles || [],
      status: 'active'
    };
    
    console.log('Creating user with data:', userData);
    
    // Add timeout to prevent hanging
    const createUserPromise = userRoleHelpers.createUser(userData);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 10000)
    );
    
    const user = await Promise.race([createUserPromise, timeoutPromise]);
    console.log('Created user successfully:', user.firstName, user.lastName);
    
    res.json({
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organization: user.organization,
      roles: user.roles,
      system_roles: user.system_roles,
      organization_roles: user.organization_roles,
      createdDate: user.createdDate
    });
  } catch (error) {
    console.error('Failed to create user - Full error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to create user',
      message: error.message,
      details: error.toString()
    });
  }
});

// Test user creation without UserRoleHelpers
spuriloApp.post('/api/test/create-user', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    // Direct mongoose operation
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
      userId: { type: String, required: true, unique: true },
      email: { type: String, required: true, unique: true },
      firstName: String,
      lastName: String,
      organization: String,
      roles: [String],
      system_roles: [String],
      organization_roles: [String],
      status: String,
      createdDate: { type: Date, default: Date.now }
    }));
    
    const userData = {
      userId: `user-${Date.now()}`,
      email: req.body.email || `test${Date.now()}@example.com`,
      firstName: req.body.firstName || 'Test',
      lastName: req.body.lastName || 'User',
      organization: req.body.organization || 'Test Org',
      roles: ['admin'],
      system_roles: ['admin'],
      organization_roles: [],
      status: 'active'
    };
    
    const user = new User(userData);
    await user.save();
    
    res.json({ success: true, user: userData });
  } catch (error) {
    console.error('Direct user creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create user',
      message: error.message,
      code: error.code
    });
  }
});

// Get users endpoint
spuriloApp.get('/api/users', requireAuth, async (req, res) => {
  try {
    const { userRoleHelpers } = await import('./UserRole/UserRoleHelpers.js');
    const { role } = req.query;
    
    let users;
    if (role) {
      // Get users by specific role
      users = await userRoleHelpers.getUsersByRole(role);
    } else {
      // Get all users
      users = await userRoleHelpers.getAllUsers();
    }
    
    // Return sanitized user data
    const sanitizedUsers = users.map(user => ({
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organization: user.organization,
      roles: user.roles,
      system_roles: user.system_roles,
      organization_roles: user.organization_roles,
      status: user.status
    }));
    
    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Failed to get users:', error);
    res.status(500).json({ 
      error: 'Failed to get users',
      message: error.message 
    });
  }
});

spuriloApp.get('/api/engagements', requireAuth, (req, res) => {
  // TODO: Get engagements from database
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
    },
    {
      id: 'eng-002',
      name: 'TechStart SOC 2 Audit',
      engagementType: 'internal-audit',
      customerName: 'TechStart Inc',
      consultant: 'John Smith',
      framework: 'SOC2',
      status: 'completed',
      priority: 'medium',
      scope: 'Trust Services Criteria',
      notes: 'Annual SOC 2 Type II audit',
      createdDate: '2024-01-01T00:00:00.000Z'
    }
  ];
  res.json(sampleEngagements);
});

spuriloApp.post('/api/engagements', requireAuth, (req, res) => {
  // TODO: Create engagement in database
  console.log('Creating engagement:', req.body);
  const newEngagement = {
    id: `eng-${Date.now()}`,
    ...req.body,
    status: 'planning',
    createdDate: new Date().toISOString()
  };
  res.json(newEngagement);
});

// Development redirect - redirect root to Vite dev server (must come before static middleware)
spuriloApp.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'development') {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Spurilo - Development Mode</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; background: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .logo { font-size: 32px; font-weight: bold; color: #1e40af; margin-bottom: 24px; }
          .message { color: #64748b; line-height: 1.6; margin-bottom: 24px; }
          .link { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 16px; }
          .link:hover { background: #2563eb; }
          .api-link { background: #10b981; }
          .api-link:hover { background: #059669; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🔒 Spurilo</div>
          <h1>Development Mode</h1>
          <div class="message">
            <p>You're accessing the Express API server directly. During development, the React frontend is served by Vite on a different port.</p>
            <p><strong>Access the application:</strong></p>
          </div>
          <a href="http://localhost:3000/" class="link">🌐 Frontend (localhost:3000)</a>
          <a href="http://localhost:8000/api/system/status" class="link api-link">🔧 API Status</a>
          <div class="message" style="margin-top: 24px; font-size: 14px;">
            <p><strong>Quick Links:</strong></p>
            <ul>
              <li>Frontend: <code>http://localhost:3000/</code></li>
              <li>API Health: <code>http://localhost:8000/health</code></li>
              <li>System Status: <code>http://localhost:8000/api/system/status</code></li>
            </ul>
          </div>
        </div>
      </body>
      </html>
    `);
  } else {
    // In production, serve the built React app
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Serve static files from the "public" directory (after custom routes)
spuriloApp.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
spuriloApp.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// For production: serve the React app for all non-API routes
// During development, Vite handles the frontend routing
if (process.env.NODE_ENV === 'production') {
  spuriloApp.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

console.log('Starting Spurilo server...');
console.log('MongoDB URI:', process.env.MONGODB_URI || 'mongodb://root:example@localhost:27017/spurilo?authSource=admin');

const spuriloServer = http.createServer(spuriloApp);

spuriloServer.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

spuriloServer.listen(8000, '0.0.0.0', () => {
  console.log('✅ Spurilo API server running on http://localhost:8000/');
  console.log('📊 Health check: http://localhost:8000/health');
  console.log('🔧 System status: http://localhost:8000/api/system/status');
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


// --- App 2: Ollama Proxy ---
/*
const proxyApp = express();
const PROXY_PORT = 11434;
*/
/*
// Proxy all requests to the Ollama local server
proxyApp.use('/', createProxyMiddleware({
  target: 'http://127.0.0.1:11434',
  changeOrigin: true,
  ws: true // Keep websocket support
}));
*/
/*
const proxyServer = http.createServer(proxyApp);
proxyServer.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`Ollama Proxy server running at http://0.0.0.0:${PROXY_PORT}`);
});
*/
