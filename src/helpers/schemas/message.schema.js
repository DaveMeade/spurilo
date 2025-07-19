/**
 * Message schema definitions
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;
const {
    emailValidator,
    enumValidator,
    arrayLengthValidator
} = require('./validators');

/**
 * Message read tracking schema
 */
const readTrackingSchema = new Schema({
    by: {
        type: String,
        required: true,
        validate: emailValidator
    },
    on: {
        type: Date,
        required: true,
        default: Date.now
    }
}, { _id: false });

/**
 * Message metadata schema
 */
const messageMetaSchema = new Schema({
    sent: {
        type: Date,
        required: true
    },
    read: {
        type: [readTrackingSchema],
        default: []
    },
    edited: {
        type: Boolean,
        default: false
    },
    editedAt: Date,
    editedBy: String
}, { _id: false });

/**
 * Main Message schema
 */
const messageSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString()
    },
    engagement_id: {
        type: String,
        required: true,
        index: true
    },
    control_id: {
        type: String,
        index: true,
        default: null // null means engagement-level message
    },
    from: {
        type: String,
        required: true,
        validate: emailValidator
    },
    to: {
        type: String,
        validate: {
            validator: function(v) {
                // Allow empty/null for broadcast messages
                if (!v) return true;
                return emailValidator.validator(v);
            },
            message: 'Invalid recipient email'
        },
        default: null // null means visible to all participants
    },
    message: {
        type: String,
        required: true,
        maxlength: 10000,
        trim: true
    },
    mentions: {
        type: [String],
        default: [],
        validate: [
            arrayLengthValidator(0, 20),
            {
                validator: function(mentions) {
                    // Validate mention format (@username)
                    return mentions.every(m => /^@[\w\-\.]+$/.test(m));
                },
                message: 'Invalid mention format'
            }
        ]
    },
    status: {
        type: String,
        required: true,
        enum: ['draft', 'sent', 'read', 'deleted'],
        default: 'draft'
    },
    meta: {
        type: messageMetaSchema,
        default: () => ({
            sent: new Date(),
            read: []
        })
    },
    thread_id: {
        type: String,
        index: true,
        default: null // For threading messages
    },
    reply_to: {
        type: String,
        default: null // ID of message being replied to
    },
    attachments: [{
        id: String,
        name: String,
        type: String,
        size: Number,
        url: String
    }],
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    type: {
        type: String,
        enum: ['message', 'notification', 'system', 'request', 'response'],
        default: 'message'
    },
    flags: {
        important: {
            type: Boolean,
            default: false
        },
        requiresResponse: {
            type: Boolean,
            default: false
        },
        responseReceived: {
            type: Boolean,
            default: false
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
    collection: 'messages'
});

// Indexes
messageSchema.index({ engagement_id: 1, created: -1 });
messageSchema.index({ control_id: 1, created: -1 });
messageSchema.index({ from: 1, status: 1 });
messageSchema.index({ to: 1, status: 1 });
messageSchema.index({ thread_id: 1, created: 1 });
messageSchema.index({ mentions: 1 });
messageSchema.index({ 'meta.sent': -1 });

// Virtual fields
messageSchema.virtual('isRead').get(function() {
    return this.status === 'read' || this.meta.read.length > 0;
});

messageSchema.virtual('readCount').get(function() {
    return this.meta.read.length;
});

messageSchema.virtual('isBroadcast').get(function() {
    return !this.to;
});

messageSchema.virtual('isControlLevel').get(function() {
    return !!this.control_id;
});

messageSchema.virtual('isEngagementLevel').get(function() {
    return !this.control_id;
});

// Methods
messageSchema.methods.send = function() {
    if (this.status === 'draft') {
        this.status = 'sent';
        this.meta.sent = new Date();
    }
};

messageSchema.methods.markAsRead = function(userId) {
    // Check if already read by this user
    const alreadyRead = this.meta.read.some(r => r.by === userId);
    
    if (!alreadyRead) {
        this.meta.read.push({
            by: userId,
            on: new Date()
        });
        
        // Update status if this is a direct message
        if (this.to === userId && this.status === 'sent') {
            this.status = 'read';
        }
    }
};

messageSchema.methods.edit = function(newMessage, editedBy) {
    this.message = newMessage;
    this.meta.edited = true;
    this.meta.editedAt = new Date();
    this.meta.editedBy = editedBy;
};

messageSchema.methods.delete = function() {
    this.status = 'deleted';
};

messageSchema.methods.extractMentions = function() {
    // Extract @mentions from message
    const mentionPattern = /@[\w\-\.]+/g;
    const mentions = this.message.match(mentionPattern) || [];
    this.mentions = [...new Set(mentions)]; // Remove duplicates
};

messageSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.__v;
    
    // Hide deleted messages content
    if (obj.status === 'deleted') {
        obj.message = '[Message deleted]';
        delete obj.attachments;
    }
    
    return obj;
};

// Statics
messageSchema.statics.findByEngagement = function(engagementId, includeDeleted = false) {
    const query = { engagement_id: engagementId };
    if (!includeDeleted) {
        query.status = { $ne: 'deleted' };
    }
    return this.find(query).sort({ created: -1 });
};

messageSchema.statics.findByControl = function(engagementId, controlId, includeDeleted = false) {
    const query = { 
        engagement_id: engagementId,
        control_id: controlId 
    };
    if (!includeDeleted) {
        query.status = { $ne: 'deleted' };
    }
    return this.find(query).sort({ created: -1 });
};

messageSchema.statics.findUnreadForUser = function(userId) {
    return this.find({
        $or: [
            { to: userId, status: 'sent' },
            { 
                to: null, // Broadcast messages
                'meta.read.by': { $ne: userId },
                status: 'sent'
            }
        ]
    }).sort({ 'meta.sent': -1 });
};

messageSchema.statics.findByThread = function(threadId) {
    return this.find({ 
        thread_id: threadId,
        status: { $ne: 'deleted' }
    }).sort({ created: 1 });
};

messageSchema.statics.searchMessages = function(searchTerm, engagementId = null) {
    const query = {
        $text: { $search: searchTerm },
        status: { $ne: 'deleted' }
    };
    
    if (engagementId) {
        query.engagement_id = engagementId;
    }
    
    return this.find(query).sort({ score: { $meta: 'textScore' } });
};

// Text search index
messageSchema.index({ message: 'text' });

// Pre-save middleware
messageSchema.pre('save', function(next) {
    // Extract mentions before saving
    if (this.isModified('message')) {
        this.extractMentions();
    }
    
    // Auto-generate thread_id if this is a reply
    if (this.reply_to && !this.thread_id) {
        this.thread_id = this.reply_to;
    }
    
    next();
});

// Notification schema for system-generated messages
const notificationSchema = new Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            'engagement_invite',
            'control_assigned',
            'evidence_requested',
            'finding_created',
            'status_changed',
            'mention',
            'deadline_reminder',
            'system_announcement'
        ]
    },
    title: {
        type: String,
        required: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        maxlength: 1000
    },
    relatedEntity: {
        type: {
            type: String,
            enum: ['engagement', 'control', 'user', 'organization']
        },
        id: String
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: Date,
    actionRequired: {
        type: Boolean,
        default: false
    },
    actionUrl: String,
    expiresAt: Date,
    created: {
        type: Date,
        default: Date.now,
        immutable: true
    }
}, {
    timestamps: {
        createdAt: 'created'
    },
    collection: 'notifications'
});

// Notification indexes
notificationSchema.index({ userId: 1, read: 1, created: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Notification methods
notificationSchema.methods.markAsRead = function() {
    this.read = true;
    this.readAt = new Date();
};

// Notification statics
notificationSchema.statics.findUnreadForUser = function(userId) {
    return this.find({
        userId,
        read: false,
        $or: [
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
        ]
    }).sort({ created: -1 });
};

module.exports = {
    messageSchema,
    notificationSchema,
    Message: mongoose.model('Message', messageSchema),
    Notification: mongoose.model('Notification', notificationSchema)
};