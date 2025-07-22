import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import dotenv from 'dotenv';
import { configurePassport } from './config/passport.config.js';
import authRoutes, { requireAuth } from './routes/auth.routes.js';
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

// Database connection is now handled by dbManager

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
  // Session store uses memory store for now
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

// Admin API routes
import * as adminOrgApi from './api/admin/organizations.api.js';

// Import userRoleHelpers at server startup to avoid repeated imports
let userRoleHelpers = null;
let cachedAdminCheck = { result: null, timestamp: 0 };
let appConfig = null;

// Load app configuration
async function loadAppConfig() {
  try {
    const { config } = await import('./config/config.manager.js');
    if (!config.initialized) {
      await config.initialize();
    }
    appConfig = config.getAppSettings();
    console.log('✅ App configuration loaded');
  } catch (error) {
    console.warn('⚠️  Could not load app config, using defaults:', error.message);
    // Fallback configuration
    appConfig = {
      systems: {
        userManagement: {
          enableRoleCaching: true,
          adminUserCacheTTL: 30000,
          roleQueryTimeout: 5000,
          enableStartupInitialization: true,
          maxRoleInitAttempts: 3,
          roleInitRetryInterval: 2000
        }
      }
    };
  }
}

// Admin organization endpoints
spuriloApp.get('/api/admin/organizations', adminOrgApi.requireAdmin, adminOrgApi.listOrganizations);
spuriloApp.get('/api/admin/organizations/:id', adminOrgApi.requireAdmin, adminOrgApi.getOrganization);
spuriloApp.post('/api/admin/organizations', adminOrgApi.requireAdmin, adminOrgApi.createOrganization);
spuriloApp.put('/api/admin/organizations/:id', adminOrgApi.requireAdmin, adminOrgApi.updateOrganization);
spuriloApp.get('/api/admin/organizations/:id/users', adminOrgApi.requireAdmin, adminOrgApi.getOrganizationUsers);
spuriloApp.get('/api/admin/organizations/:id/engagements', adminOrgApi.requireAdmin, adminOrgApi.getOrganizationEngagements);
console.log('✅ Admin organization routes configured');

// Function to invalidate admin user cache
function invalidateAdminCache() {
  cachedAdminCheck = { result: null, timestamp: 0 };
  console.log('🔄 Admin user cache invalidated');
}

// Helper function to get admin users with caching
async function getCachedAdminUsers() {
  const now = Date.now();
  const userMgmtConfig = appConfig?.systems?.userManagement || {};
  const cacheTTL = userMgmtConfig.adminUserCacheTTL || 30000;
  const queryTimeout = userMgmtConfig.roleQueryTimeout || 5000;
  
  // Use shorter TTL when no admins found to speed up detection of new admins
  const noAdminTTL = userMgmtConfig.noAdminCacheTTL || 5000;
  const activeTTL = (cachedAdminCheck.result && cachedAdminCheck.result.length > 0) ? cacheTTL : Math.min(cacheTTL, noAdminTTL);
  
  // Check if caching is enabled and return cached result if still valid
  if (userMgmtConfig.enableRoleCaching !== false && 
      cachedAdminCheck.result !== null && 
      (now - cachedAdminCheck.timestamp) < activeTTL) {
    return cachedAdminCheck.result;
  }
  
  try {
    // Initialize userRoleHelpers only once
    if (!userRoleHelpers) {
      const { userRoleHelpers: helpers } = await import('./user-role/user.role.helpers.js');
      userRoleHelpers = helpers;
    }
    
    if (!userRoleHelpers.initialized) {
      await userRoleHelpers.initialize();
    }
    
    // Add configurable timeout to prevent hanging
    const adminUsersPromise = userRoleHelpers.getUsersByRole('admin');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), queryTimeout)
    );
    
    const adminUsers = await Promise.race([adminUsersPromise, timeoutPromise]);
    
    // Cache the result if caching is enabled
    if (userMgmtConfig.enableRoleCaching !== false) {
      cachedAdminCheck = {
        result: adminUsers,
        timestamp: now
      };
    }
    
    return adminUsers;
  } catch (error) {
    console.error('Error getting admin users:', error.message);
    // Don't cache errors, but return empty array
    return [];
  }
}

// API Routes
spuriloApp.get('/api/system/status', async (req, res) => {
  try {
    const adminUsers = await getCachedAdminUsers();
    
    res.json({ 
      hasAdminUser: adminUsers.length > 0,
      isAuthenticated: req.isAuthenticated(),
      user: req.isAuthenticated() ? req.user : null
    });
  } catch (error) {
    console.error('Error checking system status:', error.message);
    
    // Check dbManager status instead of mongoose directly
    const { dbManager } = await import('./database/db-manager.js');
    const dbHealth = await dbManager.healthCheck();
    
    res.json({ 
      hasAdminUser: false,
      isAuthenticated: false,
      user: null,
      error: 'Database connection issue',
      details: error.message,
      dbHealth: dbHealth
    });
  }
});

// Database connection test using dbManager
spuriloApp.get('/api/test/raw-mongo', async (req, res) => {
  try {
    const { dbManager } = await import('./database/db-manager.js');
    
    if (!dbManager.initialized) {
      await dbManager.initialize();
    }
    
    const collections = await dbManager.listCollections();
    const health = await dbManager.healthCheck();
    
    res.json({
      success: true,
      database: health.database,
      collections: collections.map(c => c.name),
      connectionState: health.mongoState
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

// MongoDB test endpoint using dbManager
spuriloApp.get('/api/test/mongo', async (req, res) => {
  try {
    const { dbManager } = await import('./database/db-manager.js');
    const health = await dbManager.healthCheck();
    
    res.json({
      ...health,
      lastCheck: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      stack: error.stack,
      lastCheck: new Date().toISOString()
    });
  }
});

spuriloApp.get('/api/health/mongo', async (req, res) => {
  try {
    const { dbManager } = await import('./database/db-manager.js');
    const health = await dbManager.healthCheck();
    
    res.json({ 
      ...health,
      lastCheck: new Date().toISOString()
    });
  } catch (error) {
    res.json({ 
      status: 'error',
      connected: false,
      error: error.message,
      lastCheck: new Date().toISOString()
    });
  }
});

spuriloApp.post('/api/users', async (req, res) => {
  try {
    console.log('POST /api/users - Request received:', req.body);
    
    // Import and initialize the database manager (handles connection internally)
    const { dbManager } = await import('./database/db-manager.js');
    
    if (!dbManager.initialized) {
      await dbManager.initialize();
    }
    
    // Check if dbManager is ready
    const health = await dbManager.healthCheck();
    if (health.status !== 'healthy') {
      console.error('DbManager not healthy:', health);
      return res.status(503).json({ 
        error: 'Database not ready',
        message: 'Database manager is not healthy. Please ensure MongoDB is running.',
        health: health
      });
    }
    
    const userData = {
      userId: `user-${Date.now()}`, // Generate userId
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      organization: req.body.organization || 'Default Organization',
      title: req.body.title || '',
      system_roles: req.body.system_roles || [],
      status: 'active'
    };
    
    let organization = null;
    
    // For admin users, handle organization creation/lookup with proper domain checking
    if (req.body.system_roles?.includes('admin') && req.body.organization) {
      const orgData = {
        name: req.body.organization,
        status: 'active',
        createdBy: userData.userId
      };
      
      console.log('Finding or creating organization for admin user...');
      
      // Use the new dbManager method that properly handles domain checking
      organization = await dbManager.findOrCreateOrganizationByDomain(userData, orgData);
      userData.organizationId = organization.id;
      
      console.log('Organization resolved:', organization.name, 'with ID:', organization.id);
    } else {
      // For non-admin users, still check if organization exists by domain
      console.log('Checking for existing organization by domain...');
      organization = await dbManager.findOrganizationByDomain(userData.email);
      
      if (organization) {
        userData.organizationId = organization.id;
        userData.organization = organization.name;
        console.log('Found existing organization:', organization.name);
      } else {
        // No organization found - user will be created without organizationId for now
        console.log('No organization found for domain, user will be created without organization link');
        userData.organizationId = null;
      }
    }
    
    console.log('Creating user with validated data:', userData);
    
    // Create user with proper schema validation
    const user = await dbManager.createUser(userData);
    console.log('Created user successfully:', user.firstName, user.lastName);
    
    // Assign organization roles for initial admin users using new role mapping system
    if (req.body.system_roles?.includes('admin') && organization) {
      const { userRoleManager } = await import('./user-role/user.role.manager.js');
      await userRoleManager.ensureInitialized();
      
      await userRoleManager.assignOrganizationRole(
        user.userId,
        organization.id,
        ['admin', 'primary_contact'],
        'system-initialization'
      );
      console.log('Initial admin assigned organization roles: admin, primary_contact');
    }
    
    // Invalidate admin cache if a new admin user was created
    if (user.system_roles?.includes('admin')) {
      invalidateAdminCache();
      console.log('🔄 Admin user created, cache invalidated');
    }
    
    res.json({
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organization: user.organization,
      organizationId: user.organizationId,
      system_roles: user.system_roles,
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

// Test user creation using dbManager
spuriloApp.post('/api/test/create-user', async (req, res) => {
  try {
    const { dbManager } = await import('./database/db-manager.js');
    
    if (!dbManager.initialized) {
      await dbManager.initialize();
    }
    
    const userData = {
      userId: `user-${Date.now()}`,
      email: req.body.email || `test${Date.now()}@example.com`,
      firstName: req.body.firstName || 'Test',
      lastName: req.body.lastName || 'User',
      organization: req.body.organization || 'Test Org',
      system_roles: ['admin'],
      status: 'active'
    };
    
    const user = await dbManager.createUser(userData);
    
    // Invalidate admin cache since test users are created with admin role
    if (user.system_roles?.includes('admin')) {
      invalidateAdminCache();
      console.log('🔄 Test admin user created, cache invalidated');
    }
    
    res.json({ success: true, user: user });
  } catch (error) {
    console.error('DbManager user creation error:', error);
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
    const { userRoleHelpers } = await import('./user-role/user.role.helpers.js');
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
// MongoDB connection is now handled by dbManager

// Initialize systems on server startup
async function initializeSystems() {
  try {
    console.log('Initializing systems...');
    
    // Load configuration first
    await loadAppConfig();
    
    // Initialize database manager first
    const { dbManager } = await import('./database/db-manager.js');
    if (!dbManager.initialized) {
      await dbManager.initialize();
      console.log('✅ Database Manager initialized');
    }
    
    // Initialize Organization Manager
    try {
      const { OrganizationHelpers } = await import('./orgs/organization.helpers.js');
      await OrganizationHelpers.initialize();
      console.log('✅ Organization Manager initialized');
    } catch (orgError) {
      console.warn('⚠️  Organization Manager initialization failed:', orgError.message);
      // Continue anyway - the manager will initialize on first use
    }
    
    // Initialize UserRole helpers based on configuration
    const userMgmtConfig = appConfig?.systems?.userManagement || {};
    if (userMgmtConfig.enableStartupInitialization !== false) {
      let initAttempts = 0;
      const maxAttempts = userMgmtConfig.maxRoleInitAttempts || 3;
      const retryInterval = userMgmtConfig.roleInitRetryInterval || 2000;
      
      while (initAttempts < maxAttempts) {
        try {
          const { userRoleHelpers: helpers } = await import('./user-role/user.role.helpers.js');
          userRoleHelpers = helpers;
          if (!userRoleHelpers.initialized) {
            await userRoleHelpers.initialize();
          }
          console.log('✅ User Role Manager initialized');
          break;
        } catch (userRoleError) {
          initAttempts++;
          console.warn(`⚠️  User Role Manager initialization attempt ${initAttempts}/${maxAttempts} failed:`, userRoleError.message);
          if (initAttempts < maxAttempts) {
            console.log(`Retrying in ${retryInterval}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryInterval));
          } else {
            console.warn('⚠️  User Role Manager initialization failed after all attempts - will initialize on first use');
          }
        }
      }
    } else {
      console.log('⏭️  User Role Manager startup initialization disabled by configuration');
    }
    
    // Other system initializations can go here
    
  } catch (error) {
    console.error('❌ Failed to initialize systems:', error);
    // Server will still start but with limited functionality
  }
}

// Initialize systems asynchronously (don't block server startup)
setTimeout(() => {
  initializeSystems();
}, 1000);

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
