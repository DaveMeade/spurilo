/**
 * User schema definitions
 */

import mongoose from 'mongoose';
const { Schema } = mongoose;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    emailValidator,
    phoneValidator,
    enumValidator,
    arrayLengthValidator
} from './validators/common.validators.js';
import { 
    roleCompatibilityValidator,
    userOrganizationDomainValidator
} from './validators/business.validators.js';

// Load role configuration dynamically
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let roleConfig = null;

try {
    const configPath = path.join(__dirname, '../../../config/user.roles.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    roleConfig = JSON.parse(configData);
} catch (error) {
    console.error('Failed to load user.roles.json, using defaults:', error.message);
    // Fallback configuration
    roleConfig = {
        systemRoles: {
            admin: {},
            auditor: {}
        }
    };
}

/**
 * User preferences schema
 */
const userPreferencesSchema = new Schema({
    notifications: {
        type: Boolean,
        default: true
    },
    emailUpdates: {
        type: Boolean,
        default: true
    },
    timezone: {
        type: String,
        default: 'UTC',
        validate: {
            validator: function(tz) {
                try {
                    Intl.DateTimeFormat(undefined, { timeZone: tz });
                    return true;
                } catch {
                    return false;
                }
            },
            message: 'Invalid timezone'
        }
    }
}, { _id: false });

/**
 * OAuth provider schema
 */
const oauthProviderSchema = new Schema({
    id: {
        type: String,
        required: true
    },
    email: String,
    lastUsed: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

/**
 * User engagement participation schema
 */
const userEngagementSchema = new Schema({
    engagementId: {
        type: String,
        required: true
    },
    roles: [{
        type: String,
        required: true
    }],
    assignedControls: [String], // For control owners
    joinedDate: {
        type: Date,
        default: Date.now
    },
    active: {
        type: Boolean,
        default: true
    }
}, { _id: false });

/**
 * Main User schema
 */
const userSchema = new Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        immutable: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: [
            emailValidator,
            userOrganizationDomainValidator
        ],
        index: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    organization: {
        type: String,
        required: true,
        trim: true
    },
    organizationId: {
        type: String,
        required: true,
        index: true
    },
    department: {
        type: String,
        trim: true,
        maxlength: 100
    },
    title: {
        type: String,
        trim: true,
        maxlength: 100
    },
    phone: {
        type: String,
        validate: phoneValidator
    },
    system_roles: {
        type: [String],
        default: [],
        validate: [
            arrayLengthValidator(0, 5),
            roleCompatibilityValidator,
            {
                validator: function(roles) {
                    const validSystemRoles = Object.keys(roleConfig.systemRoles || {});
                    return roles.every(role => validSystemRoles.includes(role));
                },
                message: 'Invalid system role'
            }
        ]
    },
    engagements: {
        type: [userEngagementSchema],
        default: []
    },
    preferences: {
        type: userPreferencesSchema,
        default: () => ({})
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'pending'],
        default: 'pending',
        index: true
    },
    oauthProviders: {
        google: oauthProviderSchema,
        microsoft: oauthProviderSchema,
        github: oauthProviderSchema
    },
    lastLogin: {
        type: Date,
        default: null
    },
    passwordHash: {
        type: String,
        select: false // Don't include in queries by default
    },
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        select: false
    },
    createdDate: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: {
        createdAt: 'createdDate',
        updatedAt: 'lastUpdated'
    },
    collection: 'users'
});

// Indexes
userSchema.index({ organizationId: 1, status: 1 });
userSchema.index({ 'engagements.engagementId': 1 });
userSchema.index({ system_roles: 1 });

// Virtual fields
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('displayName').get(function() {
    return this.fullName || this.email;
});

userSchema.virtual('isAdmin').get(function() {
    return this.system_roles.includes('admin');
});

userSchema.virtual('isAuditor').get(function() {
    return this.system_roles.includes('auditor');
});

userSchema.virtual('hasSystemRole').get(function() {
    return this.system_roles.length > 0;
});

// Methods
userSchema.methods.hasRole = function(role, context = 'system') {
    switch (context) {
        case 'system':
            return this.system_roles.includes(role);
        case 'engagement':
            // Check in specific engagement context
            return false; // Implement based on engagement context
        default:
            return false;
    }
};

userSchema.methods.getEngagementRoles = function(engagementId) {
    const engagement = this.engagements.find(e => e.engagementId === engagementId);
    return engagement ? engagement.roles : [];
};

userSchema.methods.isInEngagement = function(engagementId) {
    return this.engagements.some(e => e.engagementId === engagementId && e.active);
};

userSchema.methods.addToEngagement = function(engagementId, roles, controls = []) {
    const existing = this.engagements.find(e => e.engagementId === engagementId);
    
    if (existing) {
        existing.roles = [...new Set([...existing.roles, ...roles])];
        existing.assignedControls = [...new Set([...existing.assignedControls, ...controls])];
        existing.active = true;
    } else {
        this.engagements.push({
            engagementId,
            roles,
            assignedControls: controls
        });
    }
};

userSchema.methods.removeFromEngagement = function(engagementId) {
    const engagement = this.engagements.find(e => e.engagementId === engagementId);
    if (engagement) {
        engagement.active = false;
    }
};

userSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.passwordHash;
    delete obj.passwordResetToken;
    delete obj.passwordResetExpires;
    delete obj.emailVerificationToken;
    delete obj.__v;
    return obj;
};

// Statics
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByOrganization = function(organizationId, includeInactive = false) {
    const query = { organizationId };
    if (!includeInactive) {
        query.status = 'active';
    }
    return this.find(query);
};

userSchema.statics.findByEngagement = function(engagementId) {
    return this.find({
        'engagements.engagementId': engagementId,
        'engagements.active': true,
        status: 'active'
    });
};

userSchema.statics.findAdmins = function() {
    return this.find({
        system_roles: 'admin',
        status: 'active'
    });
};

userSchema.statics.findAuditors = function() {
    return this.find({
        system_roles: 'auditor',
        status: 'active'
    });
};

// Pre-save middleware
userSchema.pre('save', function(next) {
    // Generate userId if not provided
    if (!this.userId && this.isNew) {
        this.userId = `user-${Date.now()}`;
    }
    
    next();
});

// Check if model is already compiled to avoid OverwriteModelError
const User = mongoose.models.User || mongoose.model('User', userSchema);

export {
    userSchema,
    User
};