/**
 * Simple Database Manager - Minimal version for fixing user/organization bugs
 * 
 * This is a focused implementation to solve the immediate issues:
 * 1. Schema validation for organization creation  
 * 2. Domain checking for duplicate organizations
 * 3. Proper user-organization association
 */

import mongoose from 'mongoose';
import { User } from './schemas/user.schema.js';
import { Organization } from './schemas/organization.schema.js';
import { Engagement } from './schemas/engagement.schema.js';

class SimpleDbManager {
    constructor() {
        this.initialized = false;
        this.connected = false;
        this.User = User;
        this.Organization = Organization;
        this.Engagement = Engagement;
    }

    async initialize() {
        try {
            // Connect to MongoDB with proper credentials
            await this.connect();
            
            // Ensure indexes are created
            await this.User.createIndexes();
            await this.Organization.createIndexes();
            await this.Engagement.createIndexes();
            
            this.initialized = true;
            console.log('SimpleDbManager initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize SimpleDbManager:', error);
            throw error;
        }
    }

    async connect() {
        try {
            if (mongoose.connection.readyState === 1) {
                console.log('MongoDB already connected');
                this.connected = true;
                return;
            }

            // MongoDB connection string with credentials
            const mongoUri = process.env.MONGODB_URI || 'mongodb://root:example@localhost:27017/spurilo?authSource=admin';
            console.log('DbManager connecting to MongoDB:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
            
            await mongoose.connect(mongoUri, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            
            this.connected = true;
            console.log('✅ DbManager connected to MongoDB');
            console.log('MongoDB connection state:', mongoose.connection.readyState);
        } catch (error) {
            console.error('❌ DbManager MongoDB connection error:', error.message);
            this.connected = false;
            throw error;
        }
    }

    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('SimpleDbManager not initialized. Call initialize() first.');
        }
        if (!this.connected) {
            throw new Error('SimpleDbManager not connected to MongoDB.');
        }
    }

    /**
     * Create user with schema validation
     */
    async createUser(userData) {
        this.ensureInitialized();
        
        try {
            const user = new this.User(userData);
            await user.save();
            return user.toJSON();
        } catch (error) {
            console.error('Failed to create user:', error);
            
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern || {})[0];
                throw new Error(`Duplicate ${field}: ${error.keyValue?.[field]} already exists`);
            }
            
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map(e => e.message);
                throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
            }
            
            throw error;
        }
    }

    /**
     * Find organization by domain
     */
    async findOrganizationByDomain(emailOrDomain) {
        this.ensureInitialized();
        
        try {
            const domain = emailOrDomain.includes('@') 
                ? emailOrDomain.split('@')[1] 
                : emailOrDomain;
            
            return await Organization.findByDomain(domain);
        } catch (error) {
            console.error('Failed to find organization by domain:', error);
            throw error;
        }
    }

    /**
     * Create organization with schema validation
     */
    async createOrganization(orgData) {
        this.ensureInitialized();
        
        try {
            // Ensure required schema fields are present
            const organizationData = {
                id: orgData.id || `org-${Date.now()}`,
                name: orgData.name,
                aka_names: {
                    formal_name: orgData.name, // Required field
                    friendly_name: orgData.friendly_name || orgData.name,
                    short_name: orgData.short_name || '',
                    dba: orgData.dba || ''
                },
                org_domains: orgData.org_domains || [],
                status: orgData.status || 'pending',
                settings: orgData.settings || {},
                createdBy: orgData.createdBy,
                crm_link: orgData.crm_link || ''
            };

            const organization = new this.Organization(organizationData);
            await organization.save();
            return organization.toJSON();
        } catch (error) {
            console.error('Failed to create organization:', error);
            
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern || {})[0];
                throw new Error(`Duplicate ${field}: ${error.keyValue?.[field]} already exists`);
            }
            
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map(e => e.message);
                throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
            }
            
            throw error;
        }
    }

    /**
     * Find or create organization by email domain with proper domain checking
     */
    async findOrCreateOrganizationByDomain(userData, orgData) {
        this.ensureInitialized();
        
        try {
            const domain = userData.email.split('@')[1];
            
            // First, try to find existing organization by domain
            let organization = await this.findOrganizationByDomain(domain);
            
            if (organization) {
                console.log(`Found existing organization for domain ${domain}:`, organization.name);
                return organization;
            }
            
            // Create new organization with domain
            const newOrgData = {
                ...orgData,
                org_domains: [domain], // Add the domain to the organization
                createdBy: userData.userId || userData.email
            };
            
            organization = await this.createOrganization(newOrgData);
            console.log(`Created new organization for domain ${domain}:`, organization.name);
            return organization;
            
        } catch (error) {
            console.error('Failed to find or create organization by domain:', error);
            throw error;
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const state = mongoose.connection.readyState;
            const stateMap = {
                0: 'disconnected',
                1: 'connected', 
                2: 'connecting',
                3: 'disconnecting'
            };

            return {
                status: state === 1 && this.initialized && this.connected ? 'healthy' : 'unhealthy',
                initialized: this.initialized,
                connected: this.connected,
                mongoState: stateMap[state],
                database: mongoose.connection.db?.databaseName || 'unknown'
            };
        } catch (error) {
            return {
                status: 'error',
                initialized: this.initialized,
                connected: this.connected,
                error: error.message
            };
        }
    }

    /**
     * Find users by query
     */
    async findUsers(query = {}) {
        this.ensureInitialized();
        
        try {
            return await this.User.find(query);
        } catch (error) {
            console.error('Failed to find users:', error);
            throw error;
        }
    }

    /**
     * Find user by userId field (not _id)
     */
    async findUserByUserId(userId) {
        this.ensureInitialized();
        
        try {
            return await this.User.findOne({ userId: userId });
        } catch (error) {
            console.error('Failed to find user by userId:', error);
            throw error;
        }
    }

    /**
     * Find user by email
     */
    async findUserByEmail(email) {
        this.ensureInitialized();
        
        try {
            return await this.User.findOne({ email: email });
        } catch (error) {
            console.error('Failed to find user by email:', error);
            throw error;
        }
    }

    /**
     * Update user by userId
     */
    async updateUser(userId, updateData) {
        this.ensureInitialized();
        
        try {
            const user = await this.User.findOne({ userId: userId });
            if (!user) {
                throw new Error(`User not found: ${userId}`);
            }
            
            Object.assign(user, updateData);
            user.lastUpdated = new Date();
            await user.save();
            
            return user.toJSON();
        } catch (error) {
            console.error('Failed to update user:', error);
            throw error;
        }
    }

    /**
     * Get all organizations
     */
    async getAllOrganizations() {
        this.ensureInitialized();
        
        try {
            return await this.Organization.find({});
        } catch (error) {
            console.error('Failed to get all organizations:', error);
            throw error;
        }
    }

    /**
     * Find organization by id
     */
    async findOrganizationById(id) {
        this.ensureInitialized();
        
        try {
            return await this.Organization.findOne({ id: id });
        } catch (error) {
            console.error('Failed to find organization by id:', error);
            throw error;
        }
    }

    /**
     * Update organization
     */
    async updateOrganization(id, updateData) {
        this.ensureInitialized();
        
        try {
            const organization = await this.Organization.findOne({ id: id });
            if (!organization) {
                throw new Error(`Organization not found: ${id}`);
            }
            
            Object.assign(organization, updateData);
            organization.lastUpdated = new Date();
            await organization.save();
            
            return organization.toJSON();
        } catch (error) {
            console.error('Failed to update organization:', error);
            throw error;
        }
    }

    /**
     * Get MongoDB connection state
     */
    getConnectionState() {
        return mongoose.connection.readyState;
    }

    /**
     * Get raw database for advanced operations
     */
    getDatabase() {
        if (!this.connected || mongoose.connection.readyState !== 1) {
            throw new Error('Database not connected');
        }
        return mongoose.connection.db;
    }

    /**
     * Find engagement by ID
     */
    async findEngagementById(engagementId) {
        this.ensureInitialized();
        
        try {
            return await this.Engagement.findOne({ id: engagementId });
        } catch (error) {
            console.error('Failed to find engagement:', error);
            throw error;
        }
    }

    /**
     * Get engagement participants
     */
    async getEngagementParticipants(engagementId) {
        this.ensureInitialized();
        
        try {
            const engagement = await this.Engagement.findOne({ id: engagementId });
            return engagement ? engagement.participants : [];
        } catch (error) {
            console.error('Failed to get engagement participants:', error);
            throw error;
        }
    }

    /**
     * Update engagement participants
     */
    async updateEngagementParticipants(engagementId, participants) {
        this.ensureInitialized();
        
        try {
            const engagement = await this.Engagement.findOne({ id: engagementId });
            if (!engagement) {
                throw new Error(`Engagement not found: ${engagementId}`);
            }
            
            engagement.participants = participants;
            engagement.modified = new Date();
            await engagement.save();
            
            return engagement.participants;
        } catch (error) {
            console.error('Failed to update engagement participants:', error);
            throw error;
        }
    }

    /**
     * Find users in engagement
     */
    async findUsersInEngagement(engagementId) {
        this.ensureInitialized();
        
        try {
            return await this.User.find({
                'engagements.engagementId': engagementId
            });
        } catch (error) {
            console.error('Failed to find users in engagement:', error);
            throw error;
        }
    }

    /**
     * Find users by role
     */
    async findUsersByRole(role) {
        this.ensureInitialized();
        
        try {
            return await this.User.find({
                $or: [
                    { system_roles: role },
                    { roles: role },
                    { organization_roles: role }
                ]
            });
        } catch (error) {
            console.error('Failed to find users by role:', error);
            throw error;
        }
    }

    /**
     * List database collections
     */
    async listCollections() {
        this.ensureInitialized();
        
        try {
            const db = this.getDatabase();
            return await db.listCollections().toArray();
        } catch (error) {
            console.error('Failed to list collections:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const dbManager = new SimpleDbManager();
export { SimpleDbManager as DatabaseManager, dbManager };