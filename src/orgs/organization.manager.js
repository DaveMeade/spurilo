/**
 * Organization Manager
 * Handles all organization-related business logic
 */

import { dbManager } from '../database/db-manager.js';

class OrganizationManager {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        try {
            // Ensure DB Manager is initialized
            if (!dbManager.initialized) {
                await dbManager.initialize();
            }
            this.initialized = true;
            console.log('OrganizationManager initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize OrganizationManager:', error);
            throw error;
        }
    }

    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('OrganizationManager not initialized. Call initialize() first.');
        }
    }

    /**
     * Get all organizations
     */
    async getAllOrganizations() {
        this.ensureInitialized();
        
        try {
            const organizations = await dbManager.getAllOrganizations();
            return organizations.map(org => org.toJSON ? org.toJSON() : org);
        } catch (error) {
            console.error('Failed to get all organizations:', error);
            throw error;
        }
    }

    /**
     * Get organization by ID
     */
    async getOrganizationById(id) {
        this.ensureInitialized();
        
        try {
            const organization = await dbManager.findOrganizationById(id);
            if (!organization) {
                throw new Error(`Organization not found: ${id}`);
            }
            return organization.toJSON ? organization.toJSON() : organization;
        } catch (error) {
            console.error('Failed to get organization by ID:', error);
            throw error;
        }
    }

    /**
     * Create new organization
     */
    async createOrganization(orgData, createdBy) {
        this.ensureInitialized();
        
        try {
            // Validate required fields
            if (!orgData.name) {
                throw new Error('Organization name is required');
            }

            // Check if ID already exists
            if (orgData.id) {
                const existing = await dbManager.findOrganizationById(orgData.id);
                if (existing) {
                    throw new Error('Organization ID already exists');
                }
            }

            // Check if any of the domains already exist
            if (orgData.org_domains && orgData.org_domains.length > 0) {
                for (const domain of orgData.org_domains) {
                    const existingOrg = await dbManager.findOrganizationByDomain(domain);
                    if (existingOrg) {
                        throw new Error(`Domain ${domain} is already registered to organization: ${existingOrg.name}`);
                    }
                }
            }

            // Create organization data with defaults
            const organizationData = {
                id: orgData.id || `org-${Date.now()}`,
                name: orgData.name,
                crm_link: orgData.crm_link || '',
                aka_names: {
                    formal_name: orgData.aka_names?.formal_name || orgData.name,
                    friendly_name: orgData.aka_names?.friendly_name || orgData.name,
                    short_name: orgData.aka_names?.short_name || this.generateShortName(orgData.name),
                    dba: orgData.aka_names?.dba || ''
                },
                status: orgData.status || 'pending',
                org_domains: orgData.org_domains || [],
                settings: {
                    allowSelfRegistration: orgData.settings?.allowSelfRegistration || false,
                    defaultOrganizationRole: orgData.settings?.defaultOrganizationRole || 'pending',
                    requireApproval: orgData.settings?.requireApproval !== false,
                    defaultEngagementRole: orgData.settings?.defaultEngagementRole || 'sme'
                },
                createdBy: createdBy
            };

            const organization = await dbManager.createOrganization(organizationData);
            return organization;
        } catch (error) {
            console.error('Failed to create organization:', error);
            throw error;
        }
    }

    /**
     * Update organization
     */
    async updateOrganization(id, updateData) {
        this.ensureInitialized();
        
        try {
            // Get existing organization
            const existingOrg = await dbManager.findOrganizationById(id);
            if (!existingOrg) {
                throw new Error(`Organization not found: ${id}`);
            }

            // Check domain conflicts if domains are being updated
            if (updateData.org_domains) {
                for (const domain of updateData.org_domains) {
                    const conflictingOrg = await dbManager.findOrganizationByDomain(domain);
                    if (conflictingOrg && conflictingOrg.id !== id) {
                        throw new Error(`Domain ${domain} is already registered to organization: ${conflictingOrg.name}`);
                    }
                }
            }

            // Update organization
            const updatedOrg = await dbManager.updateOrganization(id, updateData);
            return updatedOrg;
        } catch (error) {
            console.error('Failed to update organization:', error);
            throw error;
        }
    }

    /**
     * Get organization users
     */
    async getOrganizationUsers(organizationId) {
        this.ensureInitialized();
        
        try {
            const users = await dbManager.getUsersByOrganizationId(organizationId);
            return users.map(user => user.toJSON ? user.toJSON() : user);
        } catch (error) {
            console.error('Failed to get organization users:', error);
            throw error;
        }
    }

    /**
     * Get organization engagements
     */
    async getOrganizationEngagements(organizationId) {
        this.ensureInitialized();
        
        try {
            const engagements = await dbManager.getEngagementsByOrganizationId(organizationId);
            return engagements.map(eng => eng.toJSON ? eng.toJSON() : eng);
        } catch (error) {
            console.error('Failed to get organization engagements:', error);
            throw error;
        }
    }

    /**
     * Generate short name from organization name
     */
    generateShortName(name) {
        // Take first letter of each word, max 4 characters
        const words = name.split(/\s+/);
        const shortName = words
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 4);
        return shortName || 'ORG';
    }

    /**
     * Generate organization ID from name
     */
    generateOrganizationId(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
            .trim()
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
            .slice(0, 50); // Limit length
    }

    /**
     * Ensure organization ID is unique by adding suffix if needed
     */
    async ensureUniqueOrganizationId(baseId) {
        this.ensureInitialized();
        
        try {
            let uniqueId = baseId;
            let counter = 1;
            
            // Check if base ID exists
            let existing = await dbManager.findOrganizationById(uniqueId);
            
            // If it exists, keep adding suffixes until we find a unique one
            while (existing) {
                uniqueId = `${baseId}-${counter}`;
                existing = await dbManager.findOrganizationById(uniqueId);
                counter++;
                
                // Safety check to prevent infinite loop
                if (counter > 1000) {
                    uniqueId = `${baseId}-${Date.now()}`;
                    break;
                }
            }
            
            return uniqueId;
        } catch (error) {
            console.error('Failed to ensure unique organization ID:', error);
            // Fallback to timestamp suffix
            return `${baseId}-${Date.now()}`;
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const dbHealth = await dbManager.healthCheck();
            
            return {
                status: this.initialized && dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
                initialized: this.initialized,
                database: dbHealth
            };
        } catch (error) {
            return {
                status: 'error',
                initialized: this.initialized,
                error: error.message
            };
        }
    }
}

// Create and export singleton instance
const organizationManager = new OrganizationManager();
export { OrganizationManager, organizationManager };