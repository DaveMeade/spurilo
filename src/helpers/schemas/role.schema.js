/**
 * Role and permission schema definitions
 * Based on userRoles.json structure
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;
const {
    enumValidator,
    arrayLengthValidator
} = require('./validators');

/**
 * Permission schema - defines individual permissions
 */
const permissionSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['system', 'organization', 'engagement', 'user', 'data'],
        default: 'data'
    },
    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    }
}, {
    timestamps: true,
    collection: 'permissions'
});

/**
 * Base role schema - shared properties for all role types
 */
const baseRoleSchema = {
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    permissions: {
        type: [String],
        default: [],
        validate: arrayLengthValidator(0, 50)
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
};

/**
 * System role schema
 */
const systemRoleSchema = new Schema({
    ...baseRoleSchema,
    type: {
        type: String,
        default: 'system',
        immutable: true
    }
}, {
    timestamps: true,
    collection: 'system_roles'
});

/**
 * Organization role schema
 */
const organizationRoleSchema = new Schema({
    ...baseRoleSchema,
    type: {
        type: String,
        default: 'organization',
        immutable: true
    }
}, {
    timestamps: true,
    collection: 'organization_roles'
});

/**
 * Engagement role schema
 */
const engagementRoleSchema = new Schema({
    ...baseRoleSchema,
    category: {
        type: String,
        required: true,
        enum: ['system', 'consultant', 'customer']
    },
    canManageRoles: {
        type: [String],
        default: [],
        validate: {
            validator: function(roles) {
                // Validate that all roles in canManageRoles are valid engagement roles
                const validRoles = ['admin', 'auditor', 'owner', 'sme', 'controlOwner', 'manager', 'executive'];
                return roles.every(role => validRoles.includes(role));
            },
            message: 'Invalid role in canManageRoles'
        }
    },
    accessLevel: {
        type: String,
        required: true,
        enum: ['full', 'engagement', 'customer', 'control', 'limited', 'view', 'executive']
    },
    type: {
        type: String,
        default: 'engagement',
        immutable: true
    }
}, {
    timestamps: true,
    collection: 'engagement_roles'
});

/**
 * Role category schema
 */
const roleCategorySchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true,
        match: /^#[0-9A-F]{6}$/i
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    collection: 'role_categories'
});

/**
 * Access level schema
 */
const accessLevelSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    hierarchy: {
        type: Number,
        required: true // Higher number = more access
    },
    allowedActions: [String]
}, {
    timestamps: true,
    collection: 'access_levels'
});

/**
 * Role assignment schema - tracks user role assignments
 */
const roleAssignmentSchema = new Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    roleType: {
        type: String,
        required: true,
        enum: ['system', 'organization', 'engagement']
    },
    roleId: {
        type: String,
        required: true
    },
    context: {
        organizationId: String,
        engagementId: String
    },
    assignedBy: {
        type: String,
        required: true
    },
    assignedDate: {
        type: Date,
        default: Date.now
    },
    expiresAt: Date,
    active: {
        type: Boolean,
        default: true
    },
    notes: String
}, {
    timestamps: true,
    collection: 'role_assignments'
});

// Indexes
permissionSchema.index({ category: 1 });
systemRoleSchema.index({ active: 1 });
organizationRoleSchema.index({ active: 1 });
engagementRoleSchema.index({ category: 1, active: 1 });
roleAssignmentSchema.index({ userId: 1, active: 1 });
roleAssignmentSchema.index({ roleType: 1, roleId: 1 });
roleAssignmentSchema.index({ 'context.organizationId': 1 });
roleAssignmentSchema.index({ 'context.engagementId': 1 });
roleAssignmentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Methods
roleAssignmentSchema.methods.isExpired = function() {
    return this.expiresAt && this.expiresAt < new Date();
};

roleAssignmentSchema.methods.deactivate = function() {
    this.active = false;
};

// Statics
roleAssignmentSchema.statics.findActiveByUser = function(userId) {
    return this.find({
        userId,
        active: true,
        $or: [
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
        ]
    });
};

roleAssignmentSchema.statics.findByContext = function(contextType, contextId) {
    const query = { active: true };
    
    if (contextType === 'organization') {
        query['context.organizationId'] = contextId;
    } else if (contextType === 'engagement') {
        query['context.engagementId'] = contextId;
    }
    
    return this.find(query);
};

// Virtual population for role details
roleAssignmentSchema.virtual('roleDetails', {
    ref: function() {
        switch (this.roleType) {
            case 'system': return 'SystemRole';
            case 'organization': return 'OrganizationRole';
            case 'engagement': return 'EngagementRole';
            default: return null;
        }
    },
    localField: 'roleId',
    foreignField: 'id',
    justOne: true
});

module.exports = {
    permissionSchema,
    systemRoleSchema,
    organizationRoleSchema,
    engagementRoleSchema,
    roleCategorySchema,
    accessLevelSchema,
    roleAssignmentSchema,
    Permission: mongoose.model('Permission', permissionSchema),
    SystemRole: mongoose.model('SystemRole', systemRoleSchema),
    OrganizationRole: mongoose.model('OrganizationRole', organizationRoleSchema),
    EngagementRole: mongoose.model('EngagementRole', engagementRoleSchema),
    RoleCategory: mongoose.model('RoleCategory', roleCategorySchema),
    AccessLevel: mongoose.model('AccessLevel', accessLevelSchema),
    RoleAssignment: mongoose.model('RoleAssignment', roleAssignmentSchema)
};