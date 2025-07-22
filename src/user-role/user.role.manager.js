/**
 * UserRoleManager - Manages users, roles, and engagement participation
 * Handles user lifecycle, role assignments, and engagement access control
 * Uses db-manager for all database operations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * UserRoleManager
 * Central manager for user and role management
 */
class UserRoleManager {
    constructor() {
        this.initialized = false;
        this.dbManager = null;
        this.roleConfig = null;
        this.defaultRoleMap = new Map();
        this.rolePermissions = new Map();
        this.log = console.log; // Simple logging
    }

    /**
     * Initialize the manager
     */
    async initialize() {
        if (this.initialized) {
            this.log('UserRoleManager already initialized');
            return;
        }

        this.log('Initializing UserRoleManager...');
        
        // Import and initialize db-manager
        const { dbManager } = await import('../database/db-manager.js');
        this.dbManager = dbManager;
        
        if (!this.dbManager.initialized) {
            await this.dbManager.initialize();
        }
        
        await this.loadRoleConfigurations();
        
        this.initialized = true;
        this.log('UserRoleManager initialized successfully');
    }

    /**
     * Load role configurations from JSON
     */
    async loadRoleConfigurations() {
        try {
            // Load from config file
            const configPath = path.join(__dirname, '../../config/userRoles.json');
            const configData = await fs.promises.readFile(configPath, 'utf8');
            this.roleConfig = JSON.parse(configData);
            
            // Build role permissions map
            Object.entries(this.roleConfig.roles).forEach(([category, roles]) => {
                Object.entries(roles).forEach(([roleId, roleData]) => {
                    this.rolePermissions.set(roleId, new Set(roleData.permissions || []));
                    
                    // Handle default role mappings
                    if (roleData.default_role_ids) {
                        roleData.default_role_ids.forEach(defaultId => {
                            this.defaultRoleMap.set(defaultId, roleId);
                        });
                    }
                });
            });
            
            this.log('Role configurations loaded successfully');
        } catch (error) {
            console.error('Failed to load role configurations:', error);
            // Use default minimal configuration
            this.roleConfig = {
                roles: {
                    system: {
                        admin: { permissions: ['*'] },
                        auditor: { permissions: ['view_all_engagements'] }
                    },
                    engagement: {
                        customer: {},
                        consultant: {}
                    }
                }
            };
        }
    }

    /**
     * Create a new user
     */
    async createUser(userData) {
        await this.ensureInitialized();
        
        try {
            // Generate userId if not provided
            if (!userData.userId) {
                userData.userId = this.generateUserId(userData.email);
            }
            
            // Map legacy roles to new structure
            if (userData.roles && !userData.system_roles) {
                userData.system_roles = [];
                userData.organization_roles = [];
                userData.roles.forEach(role => {
                    const mappedRole = this.defaultRoleMap.get(role) || role;
                    if (['admin', 'auditor'].includes(mappedRole)) {
                        userData.system_roles.push(mappedRole);
                    } else {
                        userData.organization_roles.push(mappedRole);
                    }
                });
            }
            
            // Create user using db-manager
            const user = await this.dbManager.createUser({
                ...userData,
                engagements: userData.engagements || [],
                status: userData.status || 'active',
                createdDate: new Date(),
                lastUpdated: new Date()
            });
            
            this.log(`Created new user: ${user.firstName} ${user.lastName} (${userData.userId})`);
            
            return user;
        } catch (error) {
            console.error('Failed to create user:', error);
            throw error;
        }
    }

    /**
     * Update user information
     */
    async updateUser(userId, updateData) {
        await this.ensureInitialized();
        
        try {
            const user = await this.dbManager.findUserByUserId(userId);
            if (!user) {
                throw new Error(`User not found: ${userId}`);
            }

            // Update user using db-manager
            const updatedUser = await this.dbManager.updateUser(userId, updateData);
            
            this.log(`Updated user: ${userId}`);
            return updatedUser;
        } catch (error) {
            console.error('Failed to update user:', error);
            throw error;
        }
    }

    /**
     * Assign roles to a user
     */
    async assignUserRoles(userId, roles) {
        await this.ensureInitialized();
        
        try {
            const user = await this.dbManager.findUserByUserId(userId);
            if (!user) {
                throw new Error(`User not found: ${userId}`);
            }

            // Validate roles
            const validRoles = [];
            const invalidRoles = [];
            
            roles.forEach(role => {
                // Map legacy role names to new structure
                const mappedRole = this.defaultRoleMap.get(role) || role;
                
                if (this.rolePermissions.has(mappedRole)) {
                    validRoles.push(mappedRole);
                } else {
                    invalidRoles.push(role);
                }
            });
            
            if (invalidRoles.length > 0) {
                console.warn(`Invalid roles: ${invalidRoles.join(', ')}`);
            }
            
            // Categorize roles
            const systemRoles = validRoles.filter(r => ['admin', 'auditor'].includes(r));
            const orgRoles = validRoles.filter(r => !['admin', 'auditor'].includes(r));
            
            // Update user roles
            const updatedUser = await this.dbManager.updateUser(userId, {
                system_roles: [...new Set([...(user.system_roles || []), ...systemRoles])],
                organization_roles: [...new Set([...(user.organization_roles || []), ...orgRoles])]
            });
            
            this.log(`Assigned roles to user ${userId}: ${validRoles.join(', ')}`);
            return updatedUser;
        } catch (error) {
            console.error('Failed to assign user roles:', error);
            throw error;
        }
    }

    /**
     * Remove roles from a user
     */
    async removeUserRoles(userId, roles) {
        await this.ensureInitialized();
        
        try {
            const user = await this.dbManager.findUserByUserId(userId);
            if (!user) {
                throw new Error(`User not found: ${userId}`);
            }

            // Map legacy role names
            const mappedRoles = roles.map(role => this.defaultRoleMap.get(role) || role);
            
            // Update user roles
            const updatedUser = await this.dbManager.updateUser(userId, {
                system_roles: (user.system_roles || []).filter(r => !mappedRoles.includes(r)),
                organization_roles: (user.organization_roles || []).filter(r => !mappedRoles.includes(r))
            });
            
            this.log(`Removed roles from user ${userId}: ${roles.join(', ')}`);
            return updatedUser;
        } catch (error) {
            console.error('Failed to remove user roles:', error);
            throw error;
        }
    }

    /**
     * Add user to engagement
     */
    async addUserToEngagement(userId, engagementId, roles, assignedControls = []) {
        await this.ensureInitialized();
        
        try {
            const user = await this.dbManager.findUserByUserId(userId);
            if (!user) {
                throw new Error(`User not found: ${userId}`);
            }

            // Update user's engagements
            const engagements = user.engagements || [];
            const existingEngagement = engagements.find(e => e.engagementId === engagementId);
            
            if (existingEngagement) {
                // Update existing engagement
                existingEngagement.roles = [...new Set([...existingEngagement.roles, ...roles])];
                existingEngagement.assignedControls = [...new Set([...existingEngagement.assignedControls, ...assignedControls])];
            } else {
                // Add new engagement
                engagements.push({
                    engagementId,
                    roles,
                    assignedControls,
                    joinedDate: new Date()
                });
            }

            await this.dbManager.updateUser(userId, { engagements });

            // Update engagement participants
            await this.updateEngagementParticipants(engagementId);

            this.log(`Added user ${userId} to engagement ${engagementId} with roles: ${roles.join(', ')}`);
            return true;
        } catch (error) {
            console.error('Failed to add user to engagement:', error);
            throw error;
        }
    }

    /**
     * Remove user from engagement
     */
    async removeUserFromEngagement(userId, engagementId) {
        await this.ensureInitialized();
        
        try {
            const user = await this.dbManager.findUserByUserId(userId);
            if (!user) {
                throw new Error(`User not found: ${userId}`);
            }

            const engagements = (user.engagements || []).filter(e => e.engagementId !== engagementId);
            await this.dbManager.updateUser(userId, { engagements });

            // Update engagement participants
            await this.updateEngagementParticipants(engagementId);

            this.log(`Removed user ${userId} from engagement ${engagementId}`);
            return true;
        } catch (error) {
            console.error('Failed to remove user from engagement:', error);
            throw error;
        }
    }

    /**
     * Update engagement participants
     */
    async updateEngagementParticipants(engagementId) {
        await this.ensureInitialized();
        
        try {
            const users = await this.dbManager.findUsersInEngagement(engagementId);
            
            const participants = users.map(user => {
                const engagement = user.engagements.find(e => e.engagementId === engagementId);
                return {
                    userId: user.userId,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    organization: user.organization,
                    roles: engagement ? engagement.roles : [],
                    assignedControls: engagement ? engagement.assignedControls : [],
                    joinedDate: engagement ? engagement.joinedDate : new Date()
                };
            });

            await this.dbManager.updateEngagementParticipants(engagementId, participants);
            
            this.log(`Updated participants for engagement ${engagementId}: ${participants.length} users`);
            return participants;
        } catch (error) {
            console.error('Failed to update engagement participants:', error);
            throw error;
        }
    }

    /**
     * Get user by ID
     */
    async getUser(userId) {
        await this.ensureInitialized();
        
        try {
            return await this.dbManager.findUserByUserId(userId);
        } catch (error) {
            console.error('Failed to get user:', error);
            throw error;
        }
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email) {
        await this.ensureInitialized();
        
        try {
            return await this.dbManager.findUserByEmail(email);
        } catch (error) {
            console.error('Failed to get user by email:', error);
            throw error;
        }
    }

    /**
     * Get users by role
     */
    async getUsersByRole(role) {
        await this.ensureInitialized();
        
        try {
            return await this.dbManager.findUsersByRole(role);
        } catch (error) {
            console.error('Failed to get users by role:', error);
            throw error;
        }
    }

    /**
     * Get engagement participants
     */
    async getEngagementParticipants(engagementId) {
        await this.ensureInitialized();
        
        try {
            return await this.dbManager.getEngagementParticipants(engagementId);
        } catch (error) {
            console.error('Failed to get engagement participants:', error);
            throw error;
        }
    }

    /**
     * Get users in engagement
     */
    async getUsersInEngagement(engagementId) {
        await this.ensureInitialized();
        
        try {
            return await this.dbManager.findUsersInEngagement(engagementId);
        } catch (error) {
            console.error('Failed to get users in engagement:', error);
            throw error;
        }
    }

    /**
     * Check if user has permission
     */
    async userHasPermission(userId, permission, engagementId = null) {
        await this.ensureInitialized();
        
        try {
            const user = await this.dbManager.findUserByUserId(userId);
            if (!user || user.status !== 'active') {
                return false;
            }

            // Check system-wide permissions first
            const systemRoles = user.system_roles || [];
            for (const role of systemRoles) {
                const permissions = this.rolePermissions.get(role);
                if (permissions && (permissions.has('*') || permissions.has(permission))) {
                    return true;
                }
            }
            
            // If checking for engagement-specific permission, use engagement roles
            if (engagementId) {
                const engagement = user.engagements.find(e => e.engagementId === engagementId);
                if (engagement) {
                    for (const role of engagement.roles) {
                        const permissions = this.rolePermissions.get(role);
                        if (permissions && (permissions.has('*') || permissions.has(permission))) {
                            return true;
                        }
                    }
                }
            }
            
            return false;
        } catch (error) {
            console.error('Failed to check user permission:', error);
            return false;
        }
    }

    /**
     * Save or update organization
     */
    async saveOrganization(organizationData) {
        await this.ensureInitialized();
        
        try {
            const organizationId = organizationData.organizationId || organizationData.id || `org-${Date.now()}`;
            
            let organization = await this.dbManager.findOrganizationById(organizationId);
            
            if (organization) {
                // Update existing organization
                organization = await this.dbManager.updateOrganization(organizationId, organizationData);
                this.log(`Updated organization: ${organization.name}`);
            } else {
                // Create new organization
                organization = await this.dbManager.createOrganization({
                    ...organizationData,
                    id: organizationId,
                    createdDate: new Date(),
                    lastUpdated: new Date()
                });
                this.log(`Created new organization: ${organization.name}`);
            }
            
            return organization;
        } catch (error) {
            console.error('Failed to save organization:', error);
            throw error;
        }
    }

    /**
     * Get organization
     */
    async getOrganization(identifier) {
        await this.ensureInitialized();
        
        try {
            return await this.dbManager.findOrganizationById(identifier);
        } catch (error) {
            console.error('Failed to get organization:', error);
            throw error;
        }
    }

    /**
     * Generate user ID from email
     */
    generateUserId(email) {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        return `${emailPrefix}-${timestamp}-${randomStr}`;
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
     * Health check
     */
    async healthCheck() {
        try {
            if (!this.initialized) {
                return { status: 'not initialized', initialized: false };
            }

            const dbHealth = await this.dbManager.healthCheck();
            
            return {
                status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
                initialized: this.initialized,
                dbHealth: dbHealth,
                roleConfigLoaded: !!this.roleConfig
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message
            };
        }
    }
}

// Create and export singleton
const userRoleManager = new UserRoleManager();
export { UserRoleManager, userRoleManager };