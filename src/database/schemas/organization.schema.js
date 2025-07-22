/**
 * Organization schema definitions
 */

import mongoose from 'mongoose';
const { Schema } = mongoose;
import {
    emailValidator,
    urlValidator,
    enumValidator,
    arrayLengthValidator
} from './validators/common.validators.js';
import { organizationStatusTransitionValidator } from './validators/business.validators.js';

/**
 * Organization name variants schema
 */
const organizationNamesSchema = new Schema({
    formal_name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    friendly_name: {
        type: String,
        trim: true,
        maxlength: 100
    },
    short_name: {
        type: String,
        trim: true,
        maxlength: 20,
        uppercase: true
    },
    dba: {
        type: String,
        trim: true,
        maxlength: 200
    }
}, { _id: false });

/**
 * Organization settings schema
 */
const organizationSettingsSchema = new Schema({
    allowSelfRegistration: {
        type: Boolean,
        default: false
    },
    defaultOrganizationRole: {
        type: String,
        default: 'pending',
        validate: enumValidator(['pending', 'manage_engagements', 'view_reports', 'manage_users'])
    },
    requireApproval: {
        type: Boolean,
        default: true
    },
    defaultEngagementRole: {
        type: String,
        default: 'sme',
        validate: enumValidator(['sme', 'controlOwner', 'manager', 'executive'])
    }
}, { _id: false });

/**
 * Main Organization schema
 */
const organizationSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/^[a-zA-Z0-9\-]+$/, 'Organization ID can only contain letters, numbers, and hyphens']
    },
    crm_link: {
        type: String,
        validate: urlValidator
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
        index: true
    },
    aka_names: {
        type: organizationNamesSchema,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'active', 'paused', 'disabled', 'archived'],
        default: 'pending',
        validate: organizationStatusTransitionValidator
    },
    org_domains: {
        type: [String],
        validate: [
            arrayLengthValidator(0, 10),
            {
                validator: function(domains) {
                    if (!domains || !Array.isArray(domains)) return true;
                    // Validate each domain format
                    return domains.every(domain => 
                        /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/.test(domain)
                    );
                },
                message: 'Invalid domain format in org_domains'
            }
        ]
    },
    settings: {
        type: organizationSettingsSchema,
        default: () => ({})
    },
    createdBy: {
        type: String,
        required: true,
        immutable: true // Cannot be changed after creation
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
    collection: 'organizations'
});

// Indexes
organizationSchema.index({ status: 1, name: 1 });
organizationSchema.index({ org_domains: 1 });
organizationSchema.index({ 'aka_names.short_name': 1 });

// Virtual for active status check
organizationSchema.virtual('isActive').get(function() {
    return this.status === 'active';
});

// Pre-save middleware
organizationSchema.pre('save', function(next) {
    // Auto-generate short name if not provided
    if (!this.aka_names.short_name && this.name) {
        this.aka_names.short_name = this.name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 20);
    }
    
    // Set friendly name if not provided
    if (!this.aka_names.friendly_name) {
        this.aka_names.friendly_name = this.name;
    }
    
    next();
});

// Methods
organizationSchema.methods.canUserRegister = function(emailDomain) {
    if (!this.settings.allowSelfRegistration) return false;
    if (!this.org_domains || this.org_domains.length === 0) return true;
    return this.org_domains.includes(emailDomain);
};

organizationSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.__v;
    return obj;
};

// Statics
organizationSchema.statics.findByDomain = function(domain) {
    return this.findOne({ 
        org_domains: domain,
        status: { $in: ['active', 'paused'] }
    });
};

organizationSchema.statics.findActive = function() {
    return this.find({ status: 'active' });
};

// Check if model is already compiled to avoid OverwriteModelError
const Organization = mongoose.models.Organization || mongoose.model('Organization', organizationSchema);

export {
    organizationSchema,
    Organization
};