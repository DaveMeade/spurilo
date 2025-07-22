/**
 * Central export point for all Mongoose schemas
 * This file serves as the single source of truth for database schemas
 * 
 * Usage:
 * import { User, Organization, Engagement } from './database/schemas/index.js';
 * 
 * or for schemas only:
 * import { userSchema, organizationSchema } from './database/schemas/index.js';
 */

// Import all schemas and models
import {
    organizationSchema,
    Organization
} from './organization.schema.js';

import {
    userSchema,
    User
} from './user.schema.js';

import {
    engagementSchema,
    engagementControlProfileSchema,
    Engagement,
    EngagementControlProfile
} from './engagement.schema.js';

import {
    messageSchema,
    notificationSchema,
    Message,
    Notification
} from './message.schema.js';

import {
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
} from './role.schema.js';

import {
    engagementTypeSchema,
    engagementTypeSettingsSchema,
    EngagementType,
    EngagementTypeSettings
} from './engagementType.schema.js';

// Import validators for external use
import * as commonValidators from './validators/common.validators.js';
import * as businessValidators from './validators/business.validators.js';

const validators = { ...commonValidators, ...businessValidators };

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