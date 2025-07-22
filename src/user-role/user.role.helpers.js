/**
 * UserRoleHelpers - Helper interface for user and role management
 * Provides simple, clean interface for cross-system communication
 * Abstracts the complexity of the UserRoleManager
 */

import { UserRoleManager } from './user.role.manager.js';

class UserRoleHelpers {
    constructor() {
        this.manager = null;
        this.initialized = false;
    }

    /**
     * Initialize the user role helpers
     */
    async initialize() {
        if (!this.initialized) {
            this.manager = new UserRoleManager();
            await this.manager.initialize();
            this.initialized = true;
        }
    }

    /**
     * Ensure manager is initialized
     */
    async ensureInitialized() {
        if (!this.initialized) {
            await this.initialize();
        }
    }

    /**
     * Get user by ID
     */
    async getUser(userId) {
        await this.ensureInitialized();
        return await this.manager.getUser(userId);
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email) {
        await this.ensureInitialized();
        return await this.manager.getUserByEmail(email);
    }

    /**
     * Create user
     */
    async createUser(userData) {
        await this.ensureInitialized();
        return await this.manager.createUser(userData);
    }

    /**
     * Update user
     */
    async updateUser(userId, updateData) {
        await this.ensureInitialized();
        return await this.manager.updateUser(userId, updateData);
    }

    /**
     * Get users in engagement
     */
    async getEngagementUsers(engagementId) {
        await this.ensureInitialized();
        return await this.manager.getUsersInEngagement(engagementId);
    }

    /**
     * Get engagement participants with roles and permissions
     */
    async getEngagementParticipants(engagementId) {
        await this.ensureInitialized();
        return await this.manager.getEngagementParticipants(engagementId);
    }

    /**
     * Add user to engagement
     */
    async addUserToEngagement(userId, engagementId, roles, assignedControls = []) {
        await this.ensureInitialized();
        return await this.manager.addUserToEngagement(userId, engagementId, roles, assignedControls);
    }

    /**
     * Remove user from engagement
     */
    async removeUserFromEngagement(userId, engagementId) {
        await this.ensureInitialized();
        return await this.manager.removeUserFromEngagement(userId, engagementId);
    }

    /**
     * Assign roles to user
     */
    async assignUserRoles(userId, roles) {
        await this.ensureInitialized();
        return await this.manager.assignUserRoles(userId, roles);
    }

    /**
     * Remove roles from user
     */
    async removeUserRoles(userId, roles) {
        await this.ensureInitialized();
        return await this.manager.removeUserRoles(userId, roles);
    }

    /**
     * Check if user has permission
     */
    async userHasPermission(userId, permission, engagementId = null) {
        await this.ensureInitialized();
        return await this.manager.userHasPermission(userId, permission, engagementId);
    }

    /**
     * Get users by role
     */
    async getUsersByRole(role) {
        await this.ensureInitialized();
        return await this.manager.getUsersByRole(role);
    }

    /**
     * Get available roles
     */
    async getRoles() {
        await this.ensureInitialized();
        return this.manager.getRoles();
    }

    /**
     * Get role by ID
     */
    async getRole(roleId) {
        await this.ensureInitialized();
        return this.manager.getRole(roleId);
    }

    /**
     * Get permissions for role
     */
    async getRolePermissions(roleId) {
        await this.ensureInitialized();
        return this.manager.getRolePermissions(roleId);
    }

    /**
     * Get users who can be assigned to engagements
     */
    async getAvailableUsers() {
        await this.ensureInitialized();
        return await this.manager.dbManager.findUsers({ status: 'active' });
    }

    /**
     * Get users with specific permission
     */
    async getUsersWithPermission(permission) {
        await this.ensureInitialized();
        const roles = this.manager.getRoles();
        const eligibleRoles = roles.filter(role => 
            role.permissions && role.permissions.includes(permission)
        ).map(role => role.id);
        
        if (eligibleRoles.length === 0) {
            return [];
        }
        
        return await this.manager.dbManager.findUsers({
            roles: { $in: eligibleRoles },
            status: 'active'
        });
    }

    /**
     * Get engagement summary with participant counts
     */
    async getEngagementSummary(engagementId) {
        await this.ensureInitialized();
        const participants = await this.manager.getEngagementParticipants(engagementId);
        
        const summary = {
            totalParticipants: participants.length,
            participantsByRole: {},
            activeParticipants: 0,
            pendingParticipants: 0
        };

        participants.forEach(participant => {
            // Count by status
            if (participant.status === 'active') {
                summary.activeParticipants++;
            } else if (participant.status === 'pending') {
                summary.pendingParticipants++;
            }

            // Count by roles
            participant.roles.forEach(role => {
                if (!summary.participantsByRole[role]) {
                    summary.participantsByRole[role] = 0;
                }
                summary.participantsByRole[role]++;
            });
        });

        return summary;
    }

    /**
     * Validate user role assignment
     */
    async validateRoleAssignment(userId, roles, engagementId = null) {
        await this.ensureInitialized();
        
        const user = await this.manager.getUser(userId);
        if (!user) {
            return { valid: false, reason: 'User not found' };
        }

        // Check if all roles exist
        const availableRoles = this.manager.getRoles().map(r => r.id);
        const invalidRoles = roles.filter(role => !availableRoles.includes(role));
        
        if (invalidRoles.length > 0) {
            return { 
                valid: false, 
                reason: `Invalid roles: ${invalidRoles.join(', ')}` 
            };
        }

        // Check role compatibility if needed
        // Add business logic here for role conflicts

        return { valid: true };
    }

    /**
     * Get user permissions for engagement
     */
    async getUserEngagementPermissions(userId, engagementId) {
        await this.ensureInitialized();
        const user = await this.manager.getUser(userId);
        if (!user) return [];

        const engagement = user.engagements.find(e => e.engagementId === engagementId);
        if (!engagement) return [];

        return this.manager.calculateUserPermissions(engagement.roles);
    }

    /**
     * Check if user can manage another user
     */
    async canManageUser(managerId, targetUserId) {
        await this.ensureInitialized();
        
        const manager = await this.manager.getUser(managerId);
        const target = await this.manager.getUser(targetUserId);
        
        if (!manager || !target) return false;

        // Admins can manage anyone
        if (manager.roles.includes('admin')) return true;

        // Owners can manage customer users
        if (manager.roles.includes('owner')) {
            const customerRoles = ['sme', 'controlOwner', 'manager', 'executive'];
            return target.roles.some(role => customerRoles.includes(role));
        }

        return false;
    }

    /**
     * Save organization to database
     */
    async saveOrganization(organizationData) {
        await this.ensureInitialized();
        return await this.manager.saveOrganization(organizationData);
    }

    /**
     * Get organization by identifier
     */
    async getOrganization(identifier) {
        await this.ensureInitialized();
        return await this.manager.getOrganization(identifier);
    }

    /**
     * Assign system roles to user
     */
    async assignSystemRoles(userId, systemRoles) {
        await this.ensureInitialized();
        const user = await this.manager.getUser(userId);
        if (!user) throw new Error('User not found');
        
        const updatedRoles = [...new Set([...(user.system_roles || []), ...systemRoles])];
        return await this.manager.updateUser(userId, { system_roles: updatedRoles });
    }

    /**
     * Remove system roles from user
     */
    async removeSystemRoles(userId, systemRoles) {
        await this.ensureInitialized();
        const user = await this.manager.getUser(userId);
        if (!user) throw new Error('User not found');
        
        const updatedRoles = (user.system_roles || []).filter(role => !systemRoles.includes(role));
        return await this.manager.updateUser(userId, { system_roles: updatedRoles });
    }

    /**
     * Assign organization roles to user
     */
    async assignOrganizationRoles(userId, organizationRoles) {
        await this.ensureInitialized();
        const user = await this.manager.getUser(userId);
        if (!user) throw new Error('User not found');
        
        const updatedRoles = [...new Set([...(user.organization_roles || []), ...organizationRoles])];
        return await this.manager.updateUser(userId, { organization_roles: updatedRoles });
    }

    /**
     * Remove organization roles from user
     */
    async removeOrganizationRoles(userId, organizationRoles) {
        await this.ensureInitialized();
        const user = await this.manager.getUser(userId);
        if (!user) throw new Error('User not found');
        
        const updatedRoles = (user.organization_roles || []).filter(role => !organizationRoles.includes(role));
        return await this.manager.updateUser(userId, { organization_roles: updatedRoles });
    }

    /**
     * Get users by system role
     */
    async getUsersBySystemRole(role) {
        await this.ensureInitialized();
        const allUsers = await this.manager.getAllUsers();
        return allUsers.filter(user => user.system_roles?.includes(role));
    }

    /**
     * Get users by organization role
     */
    async getUsersByOrganizationRole(role) {
        await this.ensureInitialized();
        const allUsers = await this.manager.getAllUsers();
        return allUsers.filter(user => user.organization_roles?.includes(role));
    }

    /**
     * Health check for the user role system
     */
    async healthCheck() {
        if (!this.initialized) {
            return {
                status: 'error',
                initialized: false,
                reason: 'Helpers not initialized'
            };
        }
        
        return await this.manager.healthCheck();
    }

    /**
     * Create organization
     */
    async createOrganization(orgData) {
        await this.ensureInitialized();
        return await this.manager.createOrganization(orgData);
    }

    /**
     * Get organization
     */
    async getOrganization(organizationId) {
        await this.ensureInitialized();
        return await this.manager.getOrganization(organizationId);
    }
}

// Create singleton instance
const userRoleHelpers = new UserRoleHelpers();

// Export both the class and singleton instance
export {
    UserRoleHelpers,
    userRoleHelpers
};