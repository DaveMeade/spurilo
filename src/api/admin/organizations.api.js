// Admin Organizations API Routes
// This module provides API endpoints for managing organizations

// Mock data for organizations (will be replaced with database calls)
const mockOrganizations = [
  {
    id: 'acme-corp',
    name: 'ACME Corporation',
    crm_link: 'https://crm.example.com/acme',
    aka_names: {
      formal_name: 'ACME Corporation, LLC',
      friendly_name: 'ACME',
      short_name: 'ACME',
      dba: ''
    },
    status: 'active',
    org_domains: ['acme.com', 'acme-corp.com'],
    settings: {
      allowSelfRegistration: true,
      defaultOrganizationRole: 'pending',
      requireApproval: true,
      defaultEngagementRole: 'sme'
    },
    createdBy: 'admin-user',
    createdDate: new Date('2024-01-15'),
    lastUpdated: new Date('2024-12-20')
  },
  {
    id: 'tech-startup',
    name: 'Tech Startup Inc',
    crm_link: '',
    aka_names: {
      formal_name: 'Tech Startup Incorporated',
      friendly_name: 'TechStart',
      short_name: 'TSI',
      dba: 'TechStart Solutions'
    },
    status: 'pending',
    org_domains: ['techstartup.io'],
    settings: {
      allowSelfRegistration: false,
      defaultOrganizationRole: 'pending',
      requireApproval: true,
      defaultEngagementRole: 'sme'
    },
    createdBy: 'admin-user',
    createdDate: new Date('2024-11-10'),
    lastUpdated: new Date('2024-11-10')
  }
];

// Mock users data
const mockUsers = [
  {
    userId: 'user-123',
    email: 'john.doe@acme.com',
    firstName: 'John',
    lastName: 'Doe',
    organization_roles: ['manage_engagements'],
    status: 'active',
    createdDate: new Date('2024-02-01')
  },
  {
    userId: 'user-456',
    email: 'jane.smith@acme.com',
    firstName: 'Jane',
    lastName: 'Smith',
    organization_roles: ['view_reports'],
    status: 'active',
    createdDate: new Date('2024-03-15')
  }
];

// Mock engagements data
const mockEngagements = [
  {
    id: 'acme-corp_gap-assessment_2501:v1',
    name: 'ACME Gap Assessment - 2025.01',
    type: 'gap-assessment',
    status: 'active',
    stage: 'fieldwork',
    timeline: {
      start_date: new Date('2025-01-01'),
      end_date: new Date('2025-02-28')
    }
  }
];

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
    // For now, return mock data
    res.json(mockOrganizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
};

// GET /api/admin/organizations/:id - Get organization details
export const getOrganization = async (req, res) => {
  try {
    const organization = mockOrganizations.find(org => org.id === req.params.id);
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
};

// POST /api/admin/organizations - Create new organization
export const createOrganization = async (req, res) => {
  try {
    const { id, name, status, crm_link, aka_names, org_domains, settings } = req.body;
    
    // Check if organization ID already exists
    const existing = mockOrganizations.find(org => org.id === id);
    if (existing) {
      return res.status(400).json({ error: 'Organization ID already exists' });
    }
    
    // Create new organization
    const newOrg = {
      id,
      name,
      status: status || 'pending',
      crm_link: crm_link || '',
      aka_names: {
        formal_name: aka_names?.formal_name || name,
        friendly_name: aka_names?.friendly_name || name,
        short_name: aka_names?.short_name || name.split(' ').map(w => w[0]).join('').toUpperCase(),
        dba: aka_names?.dba || ''
      },
      org_domains: org_domains || [],
      settings: settings || {
        allowSelfRegistration: false,
        defaultOrganizationRole: 'pending',
        requireApproval: true,
        defaultEngagementRole: 'sme'
      },
      createdBy: req.user.userId,
      createdDate: new Date(),
      lastUpdated: new Date()
    };
    
    mockOrganizations.push(newOrg);
    res.status(201).json(newOrg);
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
};

// PUT /api/admin/organizations/:id - Update organization
export const updateOrganization = async (req, res) => {
  try {
    const orgIndex = mockOrganizations.findIndex(org => org.id === req.params.id);
    
    if (orgIndex === -1) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    const { name, status, crm_link, aka_names, org_domains, settings } = req.body;
    const org = mockOrganizations[orgIndex];
    
    // Update fields
    if (name !== undefined) org.name = name;
    if (status !== undefined) org.status = status;
    if (crm_link !== undefined) org.crm_link = crm_link;
    if (aka_names !== undefined) org.aka_names = aka_names;
    if (org_domains !== undefined) org.org_domains = org_domains;
    if (settings !== undefined) org.settings = settings;
    
    org.lastUpdated = new Date();
    
    res.json(org);
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ error: 'Failed to update organization' });
  }
};

// GET /api/admin/organizations/:id/users - Get organization users
export const getOrganizationUsers = async (req, res) => {
  try {
    // For mock data, return users for ACME only
    if (req.params.id === 'acme-corp') {
      res.json(mockUsers);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching organization users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// GET /api/admin/organizations/:id/engagements - Get organization engagements
export const getOrganizationEngagements = async (req, res) => {
  try {
    // For mock data, return engagements for ACME only
    if (req.params.id === 'acme-corp') {
      res.json(mockEngagements);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching organization engagements:', error);
    res.status(500).json({ error: 'Failed to fetch engagements' });
  }
};