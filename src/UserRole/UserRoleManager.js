/**
 * UserRoleManager - Manages users, roles, and engagement participation
 * Handles user lifecycle, role assignments, and engagement access control
 * Integrates with MongoDB for data persistence
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// User Schema - Collection: users
const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    organization: { type: String, required: true },
    organizationId: { type: String }, // Reference to organization document
    department: { type: String },
    title: { type: String },
    phone: { type: String },
    // New role structure
    system_roles: [{ type: String }], // Platform-wide roles: admin, auditor
    organization_roles: [{ type: String }], // Organization-wide roles: manage_engagements, view_reports, manage_users
    engagements: [{
        engagementId: { type: String, required: true },
        roles: [{ type: String, required: true }],
        assignedControls: [{ type: String }],
        joinedDate: { type: Date, default: Date.now },
        status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' }
    }],
    preferences: {
        notifications: { type: Boolean, default: true },
        emailUpdates: { type: Boolean, default: true },
        timezone: { type: String, default: 'UTC' }
    },
    status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' },
    oauthProviders: {
        google: {
            id: { type: String },
            lastUsed: { type: Date }
        },
        microsoft: {
            id: { type: String },
            lastUsed: { type: Date }
        },
        linkedin: {
            id: { type: String },
            lastUsed: { type: Date }
        },
        okta: {
            id: { type: String },
            lastUsed: { type: Date }
        }
    },
    lastLogin: { type: Date },
    createdDate: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now }
});

// Organization Schema - Collection: organizations
const organizationSchema = new mongoose.Schema({
    organizationId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    domain: { type: String, unique: true, sparse: true },
    industry: { type: String },
    size: { type: String, enum: ['startup', 'small', 'medium', 'large', 'enterprise'] },
    settings: {
        allowSelfRegistration: { type: Boolean, default: false },
        defaultOrganizationRole: { type: String, default: 'pending' }, // organizationRoles.pending
        requireApproval: { type: Boolean, default: true },
        defaultEngagementRole: { type: String, default: 'sme' } // engagementRoles.sme for when users join engagements
    },
    createdBy: { type: String, required: true },
    createdDate: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now }
});

// Engagement Participant Schema
const engagementParticipantSchema = new mongoose.Schema({
    engagementId: { type: String, required: true },
    participants: [{
        userId: { type: String, required: true },
        roles: [{ type: String, required: true }],
        assignedControls: [{ type: String }],
        permissions: [{ type: String }],
        joinedDate: { type: Date, default: Date.now },
        status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' }
    }],
    createdDate: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now }
});

class UserRoleManager {
    constructor() {
        this.users = null;
        this.organizations = null;
        this.engagementParticipants = null;
        this.roleDefinitions = new Map();
        this.permissions = new Map();
        this.initialized = false;
        this.mongoConnection = null;
    }

    /**
     * Initialize the user role management system
     */
    async initialize() {
        try {
            await this.connectToMongoDB();
            await this.initializeModels();
            await this.loadRoleDefinitions();
            
            this.initialized = true;
            this.log('User Role Management system initialized successfully');
        } catch (error) {
            console.error('Failed to initialize User Role Management system:', error);
            throw error;
        }
    }

    /**
     * Connect to MongoDB
     */
    async connectToMongoDB() {
        // Check if mongoose is already connected
        if (mongoose.connection.readyState === 1) {
            this.mongoConnection = mongoose.connection;
            this.log('Using existing MongoDB connection');
            return;
        }
        
        // Get configuration from config manager if available
        let mongoUri = process.env.MONGODB_URI || 'mongodb://root:example@localhost:27017/spurilo?authSource=admin';
        let mongoOptions = {
            connectTimeoutMS: 10000,
            socketTimeoutMS: 10000,
            serverSelectionTimeoutMS: 5000
        };
        
        // Try to use configuration from appSettings if available
        if (typeof window !== 'undefined' && window.config && window.config.get) {
            mongoUri = window.config.get('database.mongodb.uri', mongoUri);
            mongoOptions = window.config.get('database.mongodb.options', mongoOptions);
        }
        
        try {
            this.mongoConnection = await mongoose.connect(mongoUri, mongoOptions);
            this.log('Connected to MongoDB successfully');
        } catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    }

    /**
     * Initialize MongoDB models
     */
    async initializeModels() {
        // Check if models already exist to avoid re-compilation errors
        this.users = mongoose.models.User || mongoose.model('User', userSchema, 'users');
        this.organizations = mongoose.models.Organization || mongoose.model('Organization', organizationSchema, 'organizations');
        this.engagementParticipants = mongoose.models.EngagementParticipant || mongoose.model('EngagementParticipant', engagementParticipantSchema);
        this.log('MongoDB models initialized');
    }

    /**
     * Load role definitions from configuration
     */
    async loadRoleDefinitions() {
        try {
            // Define default roles if no config file exists
            const defaultRoles = {
                userRoles: {
                    admin: {
                        id: 'admin',
                        name: 'Administrator',
                        description: 'Full system administration access',
                        permissions: ['user.manage', 'engagement.manage', 'system.configure']
                    },
                    auditor: {
                        id: 'auditor',
                        name: 'Auditor',
                        description: 'Conducts audits and assessments',
                        permissions: ['engagement.view', 'engagement.edit', 'controls.assess']
                    },
                    owner: {
                        id: 'owner',
                        name: 'Customer Owner',
                        description: 'Customer organization owner/administrator',
                        permissions: ['engagement.view', 'user.invite', 'controls.view']
                    },
                    sme: {
                        id: 'sme',
                        name: 'Subject Matter Expert',
                        description: 'Provides expertise on specific controls',
                        permissions: ['controls.view', 'controls.respond']
                    },
                    controlOwner: {
                        id: 'controlOwner',
                        name: 'Control Owner',
                        description: 'Owns and manages specific controls',
                        permissions: ['controls.view', 'controls.edit', 'controls.respond']
                    },
                    manager: {
                        id: 'manager',
                        name: 'Manager',
                        description: 'Manages team and approves responses',
                        permissions: ['controls.view', 'controls.approve', 'team.manage']
                    },
                    executive: {
                        id: 'executive',
                        name: 'Executive',
                        description: 'Executive oversight and approval',
                        permissions: ['engagement.view', 'reports.view', 'controls.approve']
                    }
                },
                permissions: {
                    'user.manage': 'Manage users and roles',
                    'engagement.manage': 'Create and manage engagements',
                    'engagement.view': 'View engagement details',
                    'engagement.edit': 'Edit engagement settings',
                    'system.configure': 'Configure system settings',
                    'controls.view': 'View control details',
                    'controls.edit': 'Edit control settings',
                    'controls.assess': 'Assess and score controls',
                    'controls.respond': 'Respond to control requests',
                    'controls.approve': 'Approve control responses',
                    'user.invite': 'Invite new users',
                    'reports.view': 'View reports and dashboards',
                    'team.manage': 'Manage team members'
                }
            };

            const configPath = path.join(process.cwd(), 'config', 'userRoles.json');
            let roleData = defaultRoles;
            
            if (fs.existsSync(configPath)) {
                roleData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                this.log('Loaded role definitions from configuration file');
            } else {
                this.log('Using default role definitions');
            }
                
            // Load role definitions from new structure
            const roleCategories = ['systemRoles', 'organizationRoles', 'engagementRoles'];
            
            roleCategories.forEach(category => {
                if (roleData[category]) {
                    Object.values(roleData[category]).forEach(role => {
                        this.roleDefinitions.set(role.id, role);
                    });
                }
            });
            
            // Load permissions
            if (roleData.permissions) {
                Object.entries(roleData.permissions).forEach(([key, permission]) => {
                    this.permissions.set(key, permission);
                });
            }
                
        } catch (error) {
            console.error('Failed to load role definitions:', error);
            throw error;
        }
    }

    /**
     * Create a new user
     */
    async createUser(userData) {
        try {
            const userId = userData.userId || `user-${Date.now()}`;
            
            // Validate roles - use new role structure
            const systemRoles = userData.system_roles || [];
            const organizationRoles = userData.organization_roles || [];
            
            // Legacy support: if old roles field is provided, map to new structure
            const legacyRoles = userData.roles || [];
            
            // If no roles provided at all, assign pending role
            if (systemRoles.length === 0 && organizationRoles.length === 0 && legacyRoles.length === 0) {
                organizationRoles.push('pending'); // Default to pending role
            }

            const user = new this.users({
                userId: userId,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                organization: userData.organization,
                organizationId: userData.organizationId || null,
                department: userData.department || '',
                title: userData.title || '',
                phone: userData.phone || '',
                system_roles: systemRoles,
                organization_roles: organizationRoles,
                engagements: [],
                preferences: userData.preferences || {},
                status: userData.status || 'active',
                oauthProviders: userData.oauthProviders || {},
                lastLogin: userData.lastLogin || new Date()
            });

            await user.save();
            this.log(`Created new user: ${user.firstName} ${user.lastName} (${userId})`);
            
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
        try {
            const user = await this.users.findOne({ userId: userId });
            if (!user) {
                throw new Error(`User not found: ${userId}`);
            }

            // Update allowed fields
            const allowedFields = ['firstName', 'lastName', 'organization', 'department', 'title', 'phone', 'preferences', 'status', 'lastLogin', 'oauthProviders'];
            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    if (field === 'oauthProviders' && typeof updateData[field] === 'object') {
                        // Merge OAuth providers
                        user[field] = { ...user[field], ...updateData[field] };
                    } else {
                        user[field] = updateData[field];
                    }
                }
            });

            user.lastUpdated = new Date();
            await user.save();

            this.log(`Updated user: ${userId}`);
            return user;
        } catch (error) {
            console.error('Failed to update user:', error);
            throw error;
        }
    }

    /**
     * Assign roles to user
     */
    async assignUserRoles(userId, roles) {
        try {
            const user = await this.users.findOne({ userId: userId });
            if (!user) {
                throw new Error(`User not found: ${userId}`);
            }

            // Validate roles
            const validRoles = roles.filter(role => this.roleDefinitions.has(role));
            if (validRoles.length === 0) {
                throw new Error('At least one valid role must be assigned');
            }

            // Add roles to appropriate arrays based on role type
            validRoles.forEach(role => {
                const roleDef = this.roleDefinitions.get(role);
                if (!roleDef) return;
                
                // Determine role category and add to appropriate array
                if (['admin', 'auditor'].includes(role)) {
                    if (!user.system_roles.includes(role)) {
                        user.system_roles.push(role);
                    }
                } else if (['manage_engagements', 'view_reports', 'manage_users', 'pending'].includes(role)) {
                    if (!user.organization_roles.includes(role)) {
                        user.organization_roles.push(role);
                    }
                }
            });
            
            user.lastUpdated = new Date();
            await user.save();

            this.log(`Assigned roles to user ${userId}: ${validRoles.join(', ')}`);
            return user;
        } catch (error) {
            console.error('Failed to assign user roles:', error);
            throw error;
        }
    }

    /**
     * Remove roles from user
     */
    async removeUserRoles(userId, roles) {
        try {
            const user = await this.users.findOne({ userId: userId });
            if (!user) {
                throw new Error(`User not found: ${userId}`);
            }

            // Remove roles from appropriate arrays
            roles.forEach(role => {
                if (user.system_roles.includes(role)) {
                    user.system_roles = user.system_roles.filter(r => r !== role);
                }
                if (user.organization_roles.includes(role)) {
                    user.organization_roles = user.organization_roles.filter(r => r !== role);
                }
            });
            
            // Ensure at least one role remains
            if (user.system_roles.length === 0 && user.organization_roles.length === 0) {
                user.organization_roles = ['pending']; // Default role
            }

            user.lastUpdated = new Date();
            await user.save();

            this.log(`Removed roles from user ${userId}: ${roles.join(', ')}`);
            return user;
        } catch (error) {
            console.error('Failed to remove user roles:', error);
            throw error;
        }
    }

    /**
     * Add user to engagement
     */
    async addUserToEngagement(userId, engagementId, roles, assignedControls = []) {
        try {
            const user = await this.users.findOne({ userId: userId });
            if (!user) {
                throw new Error(`User not found: ${userId}`);
            }

            // Validate roles
            const validRoles = roles.filter(role => this.roleDefinitions.has(role));
            if (validRoles.length === 0) {
                throw new Error('At least one valid role must be assigned');
            }

            // Check if user is already in engagement
            const existingEngagement = user.engagements.find(e => e.engagementId === engagementId);
            if (existingEngagement) {
                // Update existing engagement
                existingEngagement.roles = [...new Set([...existingEngagement.roles, ...validRoles])];
                existingEngagement.assignedControls = [...new Set([...existingEngagement.assignedControls, ...assignedControls])];
                existingEngagement.status = 'active';
            } else {
                // Add new engagement
                user.engagements.push({
                    engagementId: engagementId,
                    roles: validRoles,
                    assignedControls: assignedControls,
                    status: 'active'
                });
            }

            user.lastUpdated = new Date();
            await user.save();

            // Update engagement participants
            await this.updateEngagementParticipants(engagementId);

            this.log(`Added user ${userId} to engagement ${engagementId} with roles: ${validRoles.join(', ')}`);
            return user;
        } catch (error) {
            console.error('Failed to add user to engagement:', error);
            throw error;
        }
    }

    /**
     * Remove user from engagement
     */
    async removeUserFromEngagement(userId, engagementId) {
        try {
            const user = await this.users.findOne({ userId: userId });
            if (!user) {
                throw new Error(`User not found: ${userId}`);
            }

            user.engagements = user.engagements.filter(e => e.engagementId !== engagementId);
            user.lastUpdated = new Date();
            await user.save();

            // Update engagement participants
            await this.updateEngagementParticipants(engagementId);

            this.log(`Removed user ${userId} from engagement ${engagementId}`);
            return user;
        } catch (error) {
            console.error('Failed to remove user from engagement:', error);
            throw error;
        }
    }

    /**
     * Update engagement participants document
     */
    async updateEngagementParticipants(engagementId) {
        try {
            const users = await this.users.find({
                'engagements.engagementId': engagementId
            });

            const participants = users.map(user => {
                const engagement = user.engagements.find(e => e.engagementId === engagementId);
                return {
                    userId: user.userId,
                    roles: engagement.roles,
                    assignedControls: engagement.assignedControls,
                    permissions: this.calculateUserPermissions(engagement.roles),
                    joinedDate: engagement.joinedDate,
                    status: engagement.status
                };
            });

            await this.engagementParticipants.findOneAndUpdate(
                { engagementId: engagementId },
                { 
                    participants: participants,
                    lastUpdated: new Date()
                },
                { upsert: true }
            );

            this.log(`Updated engagement participants for ${engagementId}`);
        } catch (error) {
            console.error('Failed to update engagement participants:', error);
            throw error;
        }
    }

    /**
     * Calculate user permissions based on roles
     */
    calculateUserPermissions(roles) {
        const permissions = new Set();
        
        roles.forEach(roleId => {
            const role = this.roleDefinitions.get(roleId);
            if (role && role.permissions) {
                role.permissions.forEach(permission => {
                    permissions.add(permission);
                });
            }
        });

        return Array.from(permissions);
    }

    /**
     * Get user by ID
     */
    async getUser(userId) {
        try {
            return await this.users.findOne({ userId: userId });
        } catch (error) {
            console.error('Failed to get user:', error);
            throw error;
        }
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email) {
        try {
            return await this.users.findOne({ email: email });
        } catch (error) {
            console.error('Failed to get user by email:', error);
            throw error;
        }
    }

    /**
     * Get users by role
     */
    async getUsersByRole(role) {
        try {
            // Check in all role fields for backwards compatibility
            return await this.users.find({
                $or: [
                    { system_roles: role },
                    { organization_roles: role },
                    { 'engagements.roles': role },
                    { roles: role } // Legacy support for migration
                ]
            });
        } catch (error) {
            console.error('Failed to get users by role:', error);
            throw error;
        }
    }

    /**
     * Get engagement participants
     */
    async getEngagementParticipants(engagementId) {
        try {
            const participants = await this.engagementParticipants.findOne({ engagementId: engagementId });
            return participants ? participants.participants : [];
        } catch (error) {
            console.error('Failed to get engagement participants:', error);
            throw error;
        }
    }

    /**
     * Get users in engagement
     */
    async getUsersInEngagement(engagementId) {
        try {
            return await this.users.find({
                'engagements.engagementId': engagementId
            });
        } catch (error) {
            console.error('Failed to get users in engagement:', error);
            throw error;
        }
    }

    /**
     * Get available roles
     */
    getRoles() {
        return Array.from(this.roleDefinitions.values());
    }

    /**
     * Get role by ID
     */
    getRole(roleId) {
        return this.roleDefinitions.get(roleId);
    }

    /**
     * Get permissions for role
     */
    getRolePermissions(roleId) {
        const role = this.roleDefinitions.get(roleId);
        return role ? role.permissions : [];
    }

    /**
     * Check if user has permission
     */
    async userHasPermission(userId, permission, engagementId = null) {
        try {
            const user = await this.getUser(userId);
            if (!user) return false;

            // Combine all user roles
            let rolesToCheck = [
                ...(user.system_roles || []),
                ...(user.organization_roles || [])
            ];

            // If checking for engagement-specific permission, use engagement roles
            if (engagementId) {
                const engagement = user.engagements.find(e => e.engagementId === engagementId);
                if (engagement) {
                    rolesToCheck = engagement.roles;
                }
            }

            const userPermissions = this.calculateUserPermissions(rolesToCheck);
            return userPermissions.includes(permission);
        } catch (error) {
            console.error('Failed to check user permission:', error);
            return false;
        }
    }

    /**
     * Create or update an organization
     */
    async saveOrganization(organizationData) {
        try {
            const organizationId = organizationData.organizationId || `org-${Date.now()}`;
            
            let organization = await this.organizations.findOne({ 
                $or: [
                    { organizationId: organizationId },
                    { name: organizationData.name }
                ]
            });

            if (organization) {
                // Update existing organization
                Object.assign(organization, {
                    ...organizationData,
                    lastUpdated: new Date()
                });
                await organization.save();
                this.log(`Updated organization: ${organization.name}`);
            } else {
                // Create new organization
                organization = new this.organizations({
                    organizationId: organizationId,
                    name: organizationData.name,
                    domain: organizationData.domain,
                    industry: organizationData.industry,
                    size: organizationData.size,
                    settings: organizationData.settings || {},
                    createdBy: organizationData.createdBy
                });
                await organization.save();
                this.log(`Created new organization: ${organization.name}`);
            }
            
            return organization;
        } catch (error) {
            console.error('Failed to save organization:', error);
            throw error;
        }
    }

    /**
     * Get organization by ID or domain
     */
    async getOrganization(identifier) {
        try {
            return await this.organizations.findOne({
                $or: [
                    { organizationId: identifier },
                    { domain: identifier },
                    { name: identifier }
                ]
            });
        } catch (error) {
            console.error('Failed to get organization:', error);
            throw error;
        }
    }

    /**
     * Health check for the user role management system
     */
    async healthCheck() {
        try {
            const userCount = await this.users.countDocuments();
            const activeUsers = await this.users.countDocuments({ status: 'active' });
            const organizationCount = await this.organizations.countDocuments();
            const engagementParticipantCount = await this.engagementParticipants.countDocuments();

            return {
                status: this.initialized ? 'healthy' : 'error',
                initialized: this.initialized,
                mongoConnected: this.mongoConnection?.connection?.readyState === 1,
                userCount: userCount,
                activeUsers: activeUsers,
                organizationCount: organizationCount,
                engagementParticipantCount: engagementParticipantCount,
                roleDefinitionsCount: this.roleDefinitions.size,
                permissionsCount: this.permissions.size
            };
        } catch (error) {
            return {
                status: 'error',
                initialized: this.initialized,
                error: error.message
            };
        }
    }

    /**
     * Create organization
     */
    async createOrganization(orgData) {
        try {
            const organizationId = orgData.organizationId || `org-${Date.now()}`;
            
            // Set default settings with new role structure
            const defaultSettings = {
                allowSelfRegistration: false,
                defaultOrganizationRole: 'pending', // organizationRoles.pending
                requireApproval: true,
                defaultEngagementRole: 'sme' // engagementRoles.sme
            };
            
            const organization = new this.organizations({
                organizationId: organizationId,
                name: orgData.name,
                domain: orgData.domain || '',
                industry: orgData.industry || '',
                size: orgData.size || 'medium', // Default to medium if not specified
                settings: { ...defaultSettings, ...(orgData.settings || {}) },
                createdBy: orgData.createdBy || 'system', // Required field
                status: orgData.status || 'active'
            });

            await organization.save();
            this.log(`Created organization: ${organization.name} (${organizationId})`);
            return organization;
        } catch (error) {
            console.error('Failed to create organization:', error);
            throw error;
        }
    }

    /**
     * Get organization by ID
     */
    async getOrganization(organizationId) {
        try {
            return await this.organizations.findOne({ organizationId: organizationId });
        } catch (error) {
            console.error('Failed to get organization:', error);
            throw error;
        }
    }

    /**
     * Log message with system context
     */
    log(message, level = 'info') {
        if (process.env.DEBUG_USER_ROLE === 'true' || process.env.NODE_ENV === 'development') {
            console[level](`[UserRoleManager] ${message}`);
        }
    }
}

export { UserRoleManager };