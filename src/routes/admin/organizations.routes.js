const express = require('express');
const router = express.Router();

// For now, we'll use the existing UserRole helpers instead of the new schemas
// until the schemas are fully integrated

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.system_roles?.includes('admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// GET /api/admin/organizations - List all organizations
router.get('/', requireAdmin, async (req, res) => {
  try {
    const organizations = await Organization.find()
      .select('-__v')
      .sort({ name: 1 });
    
    res.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

// GET /api/admin/organizations/:id - Get organization details
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const organization = await Organization.findOne({ id: req.params.id })
      .select('-__v');
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

// POST /api/admin/organizations - Create new organization
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { id, name, status, crm_link, aka_names, org_domains, settings } = req.body;
    
    // Check if organization ID already exists
    const existing = await Organization.findOne({ id });
    if (existing) {
      return res.status(400).json({ error: 'Organization ID already exists' });
    }
    
    // Create new organization
    const organization = new Organization({
      id,
      name,
      status: status || 'pending',
      crm_link,
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
      createdBy: req.user.userId
    });
    
    await organization.save();
    res.status(201).json(organization);
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

// PUT /api/admin/organizations/:id - Update organization
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, status, crm_link, aka_names, org_domains, settings } = req.body;
    
    const organization = await Organization.findOne({ id: req.params.id });
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Update fields
    if (name !== undefined) organization.name = name;
    if (status !== undefined) organization.status = status;
    if (crm_link !== undefined) organization.crm_link = crm_link;
    if (aka_names !== undefined) organization.aka_names = aka_names;
    if (org_domains !== undefined) organization.org_domains = org_domains;
    if (settings !== undefined) organization.settings = settings;
    
    await organization.save();
    res.json(organization);
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

// GET /api/admin/organizations/:id/users - Get organization users
router.get('/:id/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ organizationId: req.params.id })
      .select('-passwordHash -__v')
      .sort({ lastName: 1, firstName: 1 });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching organization users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/organizations/:id/engagements - Get organization engagements
router.get('/:id/engagements', requireAdmin, async (req, res) => {
  try {
    const engagements = await Engagement.find({ org: req.params.id })
      .select('-__v')
      .sort({ 'timeline.start_date': -1 });
    
    res.json(engagements);
  } catch (error) {
    console.error('Error fetching organization engagements:', error);
    res.status(500).json({ error: 'Failed to fetch engagements' });
  }
});

module.exports = router;