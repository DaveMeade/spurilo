/**
 * Engagement and control profile schema definitions
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;
const {
    emailValidator,
    urlValidator,
    enumValidator,
    arrayLengthValidator,
    dateRangeValidator,
    engagementIdValidator,
    engagementStatusTransitionValidator,
    engagementStageProgressionValidator,
    participantLimitValidator,
    frameworkAvailabilityValidator,
    timelineConsistencyValidator,
    controlStatusTransitionValidator,
    controlOwnerAssignmentValidator,
    evidenceTypeValidator
} = require('./validators');

/**
 * Framework selection schema
 */
const frameworkSelectionSchema = new Schema({
    framework: {
        type: String,
        required: true,
        enum: ['SOC2', 'ISO27001', 'NIST', 'HIPAA', 'PCI-DSS', 'GDPR', 'CCPA']
    },
    components: {
        type: [String],
        default: [],
        validate: {
            validator: function(components) {
                // SOC2 specific components validation
                if (this.framework === 'SOC2') {
                    const validComponents = ['security', 'availability', 'processing integrity', 'confidentiality', 'privacy'];
                    return components.every(c => validComponents.includes(c));
                }
                return true;
            },
            message: 'Invalid components for selected framework'
        }
    },
    version: String
}, { _id: false });

/**
 * Engagement timeline schema
 */
const timelineSchema = new Schema({
    start_date: {
        type: Date,
        required: true
    },
    onboard_survey_due: Date,
    irl_delivery: Date,
    kickoff_call: Date,
    fieldwork_start: Date,
    fieldwork_end: Date,
    evidence_cutoff: Date,
    closing_call: Date,
    draft_report_delivery: Date,
    end_date: {
        type: Date,
        required: true
    },
    deliverables_due: Date
}, { 
    _id: false,
    validate: [
        timelineConsistencyValidator,
        dateRangeValidator('start_date', 'end_date')
    ]
});

/**
 * Engagement participant schema
 */
const participantSchema = new Schema({
    user_id: {
        type: String,
        required: true,
        validate: emailValidator
    },
    roles: {
        type: [String],
        required: true,
        validate: [
            arrayLengthValidator(1, 5),
            {
                validator: function(roles) {
                    const validRoles = ['admin', 'auditor', 'owner', 'sme', 'controlOwner', 'manager', 'executive'];
                    return roles.every(role => validRoles.includes(role));
                },
                message: 'Invalid engagement role'
            }
        ]
    },
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
 * Main Engagement schema
 */
const engagementSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        validate: engagementIdValidator
    },
    org: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['gap-assessment', 'internal-audit', 'audit-prep', 'audit-facilitation']
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    frameworks: {
        type: [frameworkSelectionSchema],
        required: true,
        validate: [
            arrayLengthValidator(1, 10),
            frameworkAvailabilityValidator
        ]
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'scheduled', 'active', 'extended', 'closed'],
        default: 'pending',
        validate: engagementStatusTransitionValidator,
        index: true
    },
    stage: {
        type: String,
        required: true,
        enum: ['onboarding', 'fieldwork', 'deliverable creation', 'deliverable review', 'wrap-up'],
        default: 'onboarding',
        validate: engagementStageProgressionValidator
    },
    timeline: {
        type: timelineSchema,
        required: true
    },
    engagement_owner: {
        type: String,
        required: true,
        validate: emailValidator
    },
    participants: {
        type: [participantSchema],
        default: [],
        validate: participantLimitValidator
    },
    notes: {
        type: String,
        maxlength: 5000
    },
    portal_url: {
        type: String,
        validate: urlValidator
    },
    metadata: {
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium'
        },
        tags: [String],
        customFields: {
            type: Map,
            of: Schema.Types.Mixed
        }
    },
    created: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    modified: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: {
        createdAt: 'created',
        updatedAt: 'modified'
    },
    collection: 'engagements'
});

/**
 * Evidence item schema
 */
const evidenceItemSchema = new Schema({
    id: {
        type: String,
        required: true,
        default: () => new mongoose.Types.ObjectId().toString()
    },
    type: {
        type: String,
        required: true,
        enum: ['file', 'link']
    },
    subtype: {
        type: String,
        enum: ['document', 'image'],
        required: function() {
            return this.type === 'file';
        }
    },
    name: {
        type: String,
        required: function() {
            return this.type === 'file';
        }
    },
    url: {
        type: String,
        required: function() {
            return this.type === 'link';
        },
        validate: urlValidator
    },
    desc: {
        type: String,
        maxlength: 500
    },
    provided_by: {
        type: String,
        required: true,
        validate: emailValidator
    },
    provided_date: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

/**
 * Control note schema
 */
const controlNoteSchema = new Schema({
    id: {
        type: String,
        required: true,
        default: () => new mongoose.Types.ObjectId().toString()
    },
    private: {
        type: Boolean,
        default: false
    },
    note: {
        type: String,
        required: true,
        maxlength: 2000
    },
    author: {
        type: String,
        required: true,
        validate: emailValidator
    },
    created: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

/**
 * Prior submission reference schema
 */
const priorSubmissionSchema = new Schema({
    engagement_id: {
        type: String,
        required: true
    },
    submission_date: Date,
    status: String,
    notes: String
}, { _id: false });

/**
 * Engagement Control Profile schema
 */
const engagementControlProfileSchema = new Schema({
    engagement_id: {
        type: String,
        required: true,
        index: true
    },
    requirement_id: {
        type: String,
        required: true,
        index: true
    },
    included: {
        type: Boolean,
        default: true
    },
    justification: {
        type: String,
        maxlength: 1000
    },
    control_owner: {
        type: String,
        validate: [
            emailValidator,
            controlOwnerAssignmentValidator
        ]
    },
    status: {
        type: String,
        required: true,
        enum: ['open', 'responded', 'under_review', 'action_required', 'complete'],
        default: 'open',
        validate: controlStatusTransitionValidator
    },
    owner_response: {
        type: String,
        maxlength: 5000
    },
    evidence: {
        type: [evidenceItemSchema],
        default: [],
        validate: evidenceTypeValidator
    },
    prior_submissions: {
        type: [priorSubmissionSchema],
        default: []
    },
    control_notes: {
        type: [controlNoteSchema],
        default: []
    },
    risk_rating: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
    },
    finding: {
        hasFinding: {
            type: Boolean,
            default: false
        },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical']
        },
        description: String,
        recommendation: String,
        managementResponse: String
    },
    created: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    modified: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: {
        createdAt: 'created',
        updatedAt: 'modified'
    },
    collection: 'engagement_control_profiles'
});

// Indexes
engagementSchema.index({ org: 1, status: 1 });
engagementSchema.index({ type: 1, status: 1 });
engagementSchema.index({ 'participants.user_id': 1 });
engagementSchema.index({ engagement_owner: 1 });

engagementControlProfileSchema.index({ engagement_id: 1, requirement_id: 1 }, { unique: true });
engagementControlProfileSchema.index({ control_owner: 1, status: 1 });

// Virtual fields
engagementSchema.virtual('isActive').get(function() {
    return this.status === 'active';
});

engagementSchema.virtual('participantCount').get(function() {
    return this.participants.filter(p => p.active).length;
});

engagementSchema.virtual('frameworkList').get(function() {
    return this.frameworks.map(f => f.framework);
});

engagementControlProfileSchema.virtual('hasEvidence').get(function() {
    return this.evidence.length > 0;
});

engagementControlProfileSchema.virtual('isComplete').get(function() {
    return this.status === 'complete';
});

// Methods
engagementSchema.methods.addParticipant = function(userId, roles) {
    const existing = this.participants.find(p => p.user_id === userId);
    
    if (existing) {
        existing.roles = [...new Set([...existing.roles, ...roles])];
        existing.active = true;
    } else {
        this.participants.push({
            user_id: userId,
            roles: roles
        });
    }
};

engagementSchema.methods.removeParticipant = function(userId) {
    const participant = this.participants.find(p => p.user_id === userId);
    if (participant) {
        participant.active = false;
    }
};

engagementSchema.methods.getParticipantsByRole = function(role) {
    return this.participants.filter(p => 
        p.active && p.roles.includes(role)
    );
};

engagementControlProfileSchema.methods.addEvidence = function(evidence) {
    this.evidence.push(evidence);
    if (this.status === 'open') {
        this.status = 'responded';
    }
};

engagementControlProfileSchema.methods.addNote = function(note, author, isPrivate = false) {
    this.control_notes.push({
        note,
        author,
        private: isPrivate
    });
};

// Statics
engagementSchema.statics.findByOrganization = function(orgId, includeInactive = false) {
    const query = { org: orgId };
    if (!includeInactive) {
        query.status = { $ne: 'closed' };
    }
    return this.find(query);
};

engagementSchema.statics.findActiveEngagements = function() {
    return this.find({ status: 'active' });
};

engagementControlProfileSchema.statics.findByEngagement = function(engagementId) {
    return this.find({ engagement_id: engagementId });
};

engagementControlProfileSchema.statics.findByControlOwner = function(ownerEmail) {
    return this.find({ 
        control_owner: ownerEmail,
        status: { $ne: 'complete' }
    });
};

module.exports = {
    engagementSchema,
    engagementControlProfileSchema,
    Engagement: mongoose.model('Engagement', engagementSchema),
    EngagementControlProfile: mongoose.model('EngagementControlProfile', engagementControlProfileSchema)
};