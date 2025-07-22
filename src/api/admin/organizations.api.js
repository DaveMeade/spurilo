// Admin Organizations API Routes
// This module provides API endpoints for managing organizations

import { OrganizationHelpers } from '../../orgs/organization.helpers.js';

// Ensure organization manager is initialized
async function ensureInitialized() {
  try {
    const health = await OrganizationHelpers.healthCheck();
    if (!health.initialized) {
      await OrganizationHelpers.initialize();
    }
  } catch (error) {
    console.error('Failed to ensure organization manager initialization:', error);
    // Try to initialize anyway
    await OrganizationHelpers.initialize();
  }
}

// Middleware to check admin role
export const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.system_roles?.includes('admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// GET /api/admin/organizations - List all organizations
export const listOrganizations = async (req, res) => {
  try {
    await ensureInitialized();
    const organizations = await OrganizationHelpers.getAllOrganizations();
    res.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
};

// GET /api/admin/organizations/:id - Get organization details
export const getOrganization = async (req, res) => {
  try {
    await ensureInitialized();
    const organization = await OrganizationHelpers.getOrganizationById(req.params.id);
    res.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: 'Organization not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch organization' });
    }
  }
};

// POST /api/admin/organizations - Create new organization
export const createOrganization = async (req, res) => {
  try {
    await ensureInitialized();
    // Validate organization data
    const validation = OrganizationHelpers.validateOrganizationData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }
    
    const organization = await OrganizationHelpers.createOrganization(req.body, req.user?.userId || 'system');
    res.status(201).json(organization);
  } catch (error) {
    console.error('Error creating organization:', error);
    if (error.message.includes('already exists') || error.message.includes('already registered')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create organization' });
    }
  }
};

// PUT /api/admin/organizations/:id - Update organization
export const updateOrganization = async (req, res) => {
  try {
    await ensureInitialized();
    // Validate update data if provided
    if (req.body.name !== undefined || req.body.org_domains !== undefined) {
      const validation = OrganizationHelpers.validateOrganizationData(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.errors.join(', ') });
      }
    }
    
    const organization = await OrganizationHelpers.updateOrganization(req.params.id, req.body);
    res.json(organization);
  } catch (error) {
    console.error('Error updating organization:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: 'Organization not found' });
    } else if (error.message.includes('already registered')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update organization' });
    }
  }
};

// GET /api/admin/organizations/:id/users - Get organization users
export const getOrganizationUsers = async (req, res) => {
  try {
    await ensureInitialized();
    const users = await OrganizationHelpers.getOrganizationUsers(req.params.id);
    res.json(users);
  } catch (error) {
    console.error('Error fetching organization users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// GET /api/admin/organizations/:id/engagements - Get organization engagements
export const getOrganizationEngagements = async (req, res) => {
  try {
    await ensureInitialized();
    const engagements = await OrganizationHelpers.getOrganizationEngagements(req.params.id);
    res.json(engagements);
  } catch (error) {
    console.error('Error fetching organization engagements:', error);
    res.status(500).json({ error: 'Failed to fetch engagements' });
  }
};