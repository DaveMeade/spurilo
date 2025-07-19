/**
 * Central export point for all Mongoose schemas
 * This file serves as the single source of truth for database schemas
 * 
 * Usage:
 * const { User, Organization, Engagement } = require('./helpers/schemas');
 * 
 * or for schemas only:
 * const { userSchema, organizationSchema } = require('./helpers/schemas');
 */

// Import all schemas and models
const {
    organizationSchema,
    Organization
} = require('./organization.schema');

const {
    userSchema,
    User
} = require('./user.schema');

const {
    engagementSchema,
    engagementControlProfileSchema,
    Engagement,
    EngagementControlProfile
} = require('./engagement.schema');

const {
    messageSchema,
    notificationSchema,
    Message,
    Notification
} = require('./message.schema');

const {
    permissionSchema,
    systemRoleSchema,
    organizationRoleSchema,
    engagementRoleSchema,
    roleCategorySchema,
    accessLevelSchema,
    roleAssignmentSchema,
    Permission,
    SystemRole,
    OrganizationRole,
    EngagementRole,
    RoleCategory,
    AccessLevel,
    RoleAssignment
} = require('./role.schema');

const {
    engagementTypeSchema,
    engagementTypeSettingsSchema,
    EngagementType,
    EngagementTypeSettings
} = require('./engagementType.schema');

// Import validators for external use
const validators = require('./validators');

/**
 * Schema exports - for when you need the schema definition
 */
const schemas = {
    // Core schemas
    organizationSchema,
    userSchema,
    engagementSchema,
    engagementControlProfileSchema,
    messageSchema,
    notificationSchema,
    
    // Role and permission schemas
    permissionSchema,
    systemRoleSchema,
    organizationRoleSchema,
    engagementRoleSchema,
    roleCategorySchema,
    accessLevelSchema,
    roleAssignmentSchema,
    
    // Configuration schemas
    engagementTypeSchema,
    engagementTypeSettingsSchema
};

/**
 * Model exports - for when you need the Mongoose model
 */
const models = {
    // Core models
    Organization,
    User,
    Engagement,
    EngagementControlProfile,
    Message,
    Notification,
    
    // Role and permission models
    Permission,
    SystemRole,
    OrganizationRole,
    EngagementRole,
    RoleCategory,
    AccessLevel,
    RoleAssignment,
    
    // Configuration models
    EngagementType,
    EngagementTypeSettings
};

/**
 * Helper function to initialize all schemas
 * This ensures indexes are created and validators are properly set up
 */
async function initializeSchemas() {
    try {
        // Ensure all indexes are created
        const indexPromises = Object.values(models).map(model => 
            model.createIndexes()
        );
        
        await Promise.all(indexPromises);
        
        console.log('All database schemas initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing schemas:', error);
        return false;
    }
}

/**
 * Helper function to validate all schemas are properly connected
 */
async function validateSchemas() {
    const results = {};
    
    for (const [name, model] of Object.entries(models)) {
        try {
            // Simple validation - try to compile the model
            const testDoc = new model({});
            results[name] = {
                status: 'valid',
                collectionName: model.collection.name
            };
        } catch (error) {
            results[name] = {
                status: 'invalid',
                error: error.message
            };
        }
    }
    
    return results;
}

/**
 * Get schema documentation
 */
function getSchemaDocumentation() {
    const docs = {};
    
    for (const [name, schema] of Object.entries(schemas)) {
        docs[name] = {
            paths: Object.keys(schema.paths),
            indexes: schema.indexes(),
            virtuals: Object.keys(schema.virtuals)
        };
    }
    
    return docs;
}

export {
    // Export all schemas
    organizationSchema,
    userSchema,
    engagementSchema,
    engagementControlProfileSchema,
    messageSchema,
    notificationSchema,
    permissionSchema,
    systemRoleSchema,
    organizationRoleSchema,
    engagementRoleSchema,
    roleCategorySchema,
    accessLevelSchema,
    roleAssignmentSchema,
    engagementTypeSchema,
    engagementTypeSettingsSchema,
    
    // Export all models
    Organization,
    User,
    Engagement,
    EngagementControlProfile,
    Message,
    Notification,
    Permission,
    SystemRole,
    OrganizationRole,
    EngagementRole,
    RoleCategory,
    AccessLevel,
    RoleAssignment,
    EngagementType,
    EngagementTypeSettings,
    
    // Export grouped objects for convenience
    schemas,
    models,
    validators,
    
    // Export utility functions
    initializeSchemas,
    validateSchemas,
    getSchemaDocumentation
};