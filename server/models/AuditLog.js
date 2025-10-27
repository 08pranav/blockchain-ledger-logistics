const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'transaction_created',
      'transaction_updated',
      'contract_created',
      'contract_executed',
      'contract_cancelled',
      'user_login',
      'user_logout',
      'user_created',
      'blockchain_verified',
      'block_created',
      'system_backup',
      'data_export',
      'settings_changed'
    ]
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  entityType: {
    type: String,
    enum: ['transaction', 'contract', 'user', 'block', 'system'],
    required: true
  },
  entityId: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  username: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  previousValue: {
    type: mongoose.Schema.Types.Mixed
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed
  },
  signature: {
    type: String,
    required: true
  },
  blockchainHash: {
    type: String
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'partial'],
    default: 'success'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Method to generate audit signature
auditLogSchema.methods.generateSignature = function() {
  const crypto = require('crypto');
  const data = `${this.action}${this.entityId}${this.username}${this.timestamp || Date.now()}`;
  return crypto.createHash('sha256').update(data + '© Pranav Koradiya').digest('hex');
};

// Pre-save middleware to generate signature and set immutable flag
auditLogSchema.pre('save', function(next) {
  if (this.isNew) {
    this.signature = this.generateSignature();
  }
  next();
});

// Prevent updates to audit logs (immutable)
auditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function(next) {
  const error = new Error('Audit logs are immutable and cannot be modified');
  error.status = 403;
  next(error);
});

// Index for efficient queries
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ severity: 1 });

// Static method to create audit log
auditLogSchema.statics.createLog = function(logData) {
  return new this({
    ...logData,
    signature: undefined // Will be generated in pre-save
  }).save();
};

module.exports = mongoose.model('AuditLog', auditLogSchema);