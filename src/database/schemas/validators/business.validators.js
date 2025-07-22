/**
 * Business rule validators for Mongoose schemas
 * These validators enforce application-specific business logic
 */

import { config } from '../../../config/config.manager.js';

/**
 * Engagement ID format validator
 * Expected format: orgID_engagement_type_yymm:v
 */
const engagementIdValidator = {
    validator: function(v) {
        if (!v) return false;
        // Format: orgID_type_yymm:v where v is version number
        return /^[a-zA-Z0-9\-]+_[a-zA-Z\-]+_\d{4}:v\d+$/.test(v);
    },
    message: 'Engagement ID must follow format: orgID_type_yymm:v (e.g., acme001_gap-assessment_2501:v1)'
};

/**
 * Organization status transition validator
 */
const organizationStatusTransitionValidator = {
    validator: async function(newStatus) {
        if (!this._id) return true; // New document
        
        const Organization = this.constructor;
        const original = await Organization.findById(this._id);
        if (!original) return true;
        
        const validTransitions = {
            'pending': ['active', 'disabled'],
            'active': ['paused', 'disabled', 'archived'],
            'paused': ['active', 'disabled', 'archived'],
            'disabled': ['active', 'archived'],
            'archived': [] // Terminal state
        };
        
        const allowed = validTransitions[original.status] || [];
        return allowed.includes(newStatus);
    },
    message: props => `Invalid status transition from ${props.path} to ${props.value}`
};

/**
 * Engagement status transition validator
 */
const engagementStatusTransitionValidator = {
    validator: async function(newStatus) {
        if (!this._id) return true; // New document
        
        const Engagement = this.constructor;
        const original = await Engagement.findById(this._id);
        if (!original) return true;
        
        const validTransitions = {
            'pending': ['scheduled', 'closed'],
            'scheduled': ['active', 'closed'],
            'active': ['extended', 'closed'],
            'extended': ['closed'],
            'closed': [] // Terminal state
        };
        
        const allowed = validTransitions[original.status] || [];
        return allowed.includes(newStatus);
    },
    message: props => `Invalid engagement status transition from ${props.path} to ${props.value}`
};

/**
 * Engagement stage progression validator
 */
const engagementStageProgressionValidator = {
    validator: async function(newStage) {
        if (!this._id) return true; // New document
        
        const Engagement = this.constructor;
        const original = await Engagement.findById(this._id);
        if (!original) return true;
        
        const stageOrder = [
            'onboarding',
            'fieldwork',
            'deliverable creation',
            'deliverable review',
            'wrap-up'
        ];
        
        const currentIndex = stageOrder.indexOf(original.stage);
        const newIndex = stageOrder.indexOf(newStage);
        
        // Allow moving forward or staying at same stage
        return newIndex >= currentIndex;
    },
    message: 'Cannot move to an earlier engagement stage'
};

/**
 * Control status transition validator
 */
const controlStatusTransitionValidator = {
    validator: async function(newStatus) {
        if (!this._id) return true; // New document
        
        const EngagementControl = this.constructor;
        const original = await EngagementControl.findById(this._id);
        if (!original) return true;
        
        const validTransitions = {
            'open': ['responded', 'complete'],
            'responded': ['under_review', 'action_required', 'complete'],
            'under_review': ['action_required', 'complete'],
            'action_required': ['responded', 'complete'],
            'complete': [] // Terminal state
        };
        
        const allowed = validTransitions[original.status] || [];
        return allowed.includes(newStatus);
    },
    message: props => `Invalid control status transition to ${props.value}`
};

/**
 * Role compatibility validator
 * Ensures system roles don't mix with customer roles
 */
const roleCompatibilityValidator = {
    validator: function(roles) {
        if (!roles || !Array.isArray(roles)) return true;
        
        const systemRoles = ['admin', 'auditor'];
        const customerRoles = ['owner', 'sme', 'controlOwner', 'manager', 'executive'];
        
        const hasSystemRole = roles.some(r => systemRoles.includes(r));
        const hasCustomerRole = roles.some(r => customerRoles.includes(r));
        
        // Can't have both system and customer roles
        return !(hasSystemRole && hasCustomerRole);
    },
    message: 'System roles (admin, auditor) cannot be combined with customer roles'
};

/**
 * Participant limit validator
 * Checks against configured maximum participants
 */
const participantLimitValidator = {
    validator: async function(participants) {
        if (!participants || !Array.isArray(participants)) return true;
        
        const maxParticipants = config.get('systems.audit.maxParticipants', 50);
        return participants.length <= maxParticipants;
    },
    message: async () => {
        const max = config.get('systems.audit.maxParticipants', 50);
        return `Engagement cannot exceed ${max} participants`;
    }
};

/**
 * Control owner assignment validator
 * Ensures control owner is a participant with appropriate role
 */
const controlOwnerAssignmentValidator = {
    validator: async function(controlOwnerId) {
        if (!controlOwnerId) return true;
        
        // Get the engagement this control belongs to
        // Skip validation for now - will be implemented when engagement system is refactored
        return true;
    },
    message: 'Control owner must be an engagement participant with controlOwner role'
};

/**
 * Framework availability validator
 * Ensures selected frameworks are available in the system
 */
const frameworkAvailabilityValidator = {
    validator: async function(frameworks) {
        if (!frameworks || !Array.isArray(frameworks)) return true;
        
        // This would check against available frameworks
        // For now, we'll check against known frameworks
        const availableFrameworks = ['SOC2', 'ISO27001', 'NIST', 'HIPAA', 'PCI-DSS'];
        
        return frameworks.every(f => 
            f.framework && availableFrameworks.includes(f.framework)
        );
    },
    message: 'One or more selected frameworks are not available'
};

/**
 * Evidence type validator
 * Ensures evidence has required fields based on type
 */
const evidenceTypeValidator = {
    validator: function(evidence) {
        if (!evidence || !Array.isArray(evidence)) return true;
        
        return evidence.every(e => {
            if (e.type === 'file') {
                return e.name && e.subtype && ['document', 'image'].includes(e.subtype);
            } else if (e.type === 'link') {
                return e.url && /^https?:\/\//.test(e.url);
            }
            return false;
        });
    },
    message: 'Evidence items must have valid type and required fields'
};

/**
 * Timeline consistency validator
 * Ensures all timeline dates are in logical order
 */
const timelineConsistencyValidator = {
    validator: function(timeline) {
        if (!timeline) return true;
        
        const dates = {
            start: timeline.start_date,
            onboard: timeline.onboard_survey_due,
            kickoff: timeline.kickoff_call,
            fieldworkStart: timeline.fieldwork_start,
            fieldworkEnd: timeline.fieldwork_end,
            evidenceCutoff: timeline.evidence_cutoff,
            draft: timeline.draft_report_delivery,
            end: timeline.end_date
        };
        
        // Remove null/undefined dates
        const validDates = Object.entries(dates)
            .filter(([_, date]) => date)
            .map(([key, date]) => ({ key, date: new Date(date) }));
        
        // Check chronological order
        for (let i = 1; i < validDates.length; i++) {
            if (validDates[i].date < validDates[i-1].date) {
                return false;
            }
        }
        
        return true;
    },
    message: 'Timeline dates must be in chronological order'
};

/**
 * User organization domain validator
 * Ensures user email matches organization domains
 */
const userOrganizationDomainValidator = {
    validator: async function(email) {
        if (!email || !this.organizationId) return true;
        
        // Skip domain validation for now - will be implemented in dbManager
        // This validation is now handled by the centralized database manager
        return true;
    },
    message: 'User email domain must match organization domains'
};

export {
    engagementIdValidator,
    organizationStatusTransitionValidator,
    engagementStatusTransitionValidator,
    engagementStageProgressionValidator,
    controlStatusTransitionValidator,
    roleCompatibilityValidator,
    participantLimitValidator,
    controlOwnerAssignmentValidator,
    frameworkAvailabilityValidator,
    evidenceTypeValidator,
    timelineConsistencyValidator,
    userOrganizationDomainValidator
};