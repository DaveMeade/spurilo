import mongoose from 'mongoose';
const { Schema } = mongoose;
import { 
    enumValidator,
    arrayLengthValidator 
} from './validators/common.validators.js';
import { 
    organizationRoleValidator,
    userOrganizationReferenceValidator 
} from './validators/business.validators.js';

const userOrganizationRoleSchema = new Schema({
  userId: {
    type: String,
    required: true,
    validate: [userOrganizationReferenceValidator.userId],
    index: true
  },
  organizationId: {
    type: String, 
    required: true,
    validate: [userOrganizationReferenceValidator.organizationId],
    index: true
  },
  roles: {
    type: [String],
    required: true,
    validate: [
      arrayLengthValidator(1, 10),
      organizationRoleValidator
    ]
  },
  assignedBy: {
    type: String,
    required: true,
    validate: [userOrganizationReferenceValidator.userId]
  },
  assignedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  expiresAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'expired'],
    default: 'active',
    validate: [enumValidator(['active', 'suspended', 'expired'])],
    index: true
  },
  metadata: {
    assignmentReason: {
      type: String,
      maxlength: 500
    },
    approvedBy: {
      type: String,
      validate: [userOrganizationReferenceValidator.userId]
    },
    notes: {
      type: String,
      maxlength: 1000
    }
  }
}, {
  timestamps: true,
  collection: 'userOrganizationRoles'
});

// Compound unique index
userOrganizationRoleSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

// Performance indexes
userOrganizationRoleSchema.index({ organizationId: 1, status: 1 });
userOrganizationRoleSchema.index({ userId: 1, status: 1 });
userOrganizationRoleSchema.index({ organizationId: 1, roles: 1, status: 1 });
userOrganizationRoleSchema.index({ expiresAt: 1 }, { sparse: true });

const UserOrganizationRole = mongoose.models.UserOrganizationRole || 
  mongoose.model('UserOrganizationRole', userOrganizationRoleSchema);

export { userOrganizationRoleSchema, UserOrganizationRole };