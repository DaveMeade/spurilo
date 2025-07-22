/**
 * Organization Helpers
 * Helper functions for organization-related operations
 */

import { organizationManager } from './organization.manager.js';

class OrganizationHelpers {
    /**
     * Initialize the organization system
     */
    static async initialize() {
        try {
            await organizationManager.initialize();
            console.log('OrganizationHelpers initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize OrganizationHelpers:', error);
            throw error;
        }
    }

    /**
     * Get all organizations
     */
    static async getAllOrganizations() {
        return organizationManager.getAllOrganizations();
    }

    /**
     * Get organization by ID
     */
    static async getOrganizationById(id) {
        return organizationManager.getOrganizationById(id);
    }

    /**
     * Create new organization
     */
    static async createOrganization(orgData, createdBy) {
        return organizationManager.createOrganization(orgData, createdBy);
    }

    /**
     * Generate organization ID from name
     */
    static generateOrganizationId(name) {
        return organizationManager.generateOrganizationId(name);
    }

    /**
     * Ensure organization ID is unique
     */
    static async ensureUniqueOrganizationId(baseId) {
        return organizationManager.ensureUniqueOrganizationId(baseId);
    }

    /**
     * Update organization
     */
    static async updateOrganization(id, updateData) {
        // If updating ID, ensure it's unique
        if (updateData.id && updateData.id !== id) {
            updateData.id = await organizationManager.ensureUniqueOrganizationId(updateData.id);
        }
        return organizationManager.updateOrganization(id, updateData);
    }

    /**
     * Get organization users
     */
    static async getOrganizationUsers(organizationId) {
        return organizationManager.getOrganizationUsers(organizationId);
    }

    /**
     * Get organization engagements
     */
    static async getOrganizationEngagements(organizationId) {
        return organizationManager.getOrganizationEngagements(organizationId);
    }

    /**
     * Validate organization data
     */
    static validateOrganizationData(orgData) {
        const errors = [];

        // Validate required fields
        if (!orgData.name || orgData.name.trim() === '') {
            errors.push('Organization name is required');
        }

        // Validate ID format
        if (orgData.id && !/^[a-z0-9-]+$/.test(orgData.id)) {
            errors.push('Organization ID must contain only lowercase letters, numbers, and hyphens');
        }

        // Validate status
        if (orgData.status && !['active', 'pending', 'suspended', 'inactive'].includes(orgData.status)) {
            errors.push('Invalid organization status');
        }

        // Validate domains
        if (orgData.org_domains && Array.isArray(orgData.org_domains)) {
            const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
            orgData.org_domains.forEach(domain => {
                if (!domainRegex.test(domain)) {
                    errors.push(`Invalid domain format: ${domain}`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Format organization for display
     */
    static formatOrganization(org) {
        return {
            id: org.id,
            name: org.name,
            displayName: org.aka_names?.friendly_name || org.name,
            formalName: org.aka_names?.formal_name || org.name,
            shortName: org.aka_names?.short_name || organizationManager.generateShortName(org.name),
            status: org.status,
            domains: org.org_domains || [],
            crmLink: org.crm_link,
            settings: org.settings,
            createdDate: org.createdDate,
            lastUpdated: org.lastUpdated
        };
    }

    /**
     * Check if domain is available
     */
    static async isDomainAvailable(domain, excludeOrgId = null) {
        try {
            // Access dbManager through the singleton instance, not through organizationManager property
            const { dbManager } = await import('../database/db-manager.js');
            const existingOrg = await dbManager.findOrganizationByDomain(domain);
            if (!existingOrg) {
                return true;
            }
            return excludeOrgId && existingOrg.id === excludeOrgId;
        } catch (error) {
            console.error('Error checking domain availability:', error);
            return false;
        }
    }

    /**
     * Get organization summary
     */
    static async getOrganizationSummary(organizationId) {
        try {
            const [organization, users, engagements] = await Promise.all([
                organizationManager.getOrganizationById(organizationId),
                organizationManager.getOrganizationUsers(organizationId),
                organizationManager.getOrganizationEngagements(organizationId)
            ]);

            return {
                organization: this.formatOrganization(organization),
                userCount: users.length,
                activeUsers: users.filter(u => u.status === 'active').length,
                engagementCount: engagements.length,
                activeEngagements: engagements.filter(e => e.status === 'active').length
            };
        } catch (error) {
            console.error('Failed to get organization summary:', error);
            throw error;
        }
    }

    /**
     * Health check
     */
    static async healthCheck() {
        return organizationManager.healthCheck();
    }
}

export { OrganizationHelpers };
export default OrganizationHelpers;