const mongoose = require('mongoose');

const smartContractSchema = new mongoose.Schema({
  contractId: {
    type: String,
    required: true,
    unique: true
  },
  partyA: {
    type: String,
    required: true,
    trim: true
  },
  partyB: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'INR', 'GBP', 'JPY']
  },
  dueDate: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  terms: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled', 'expired'],
    default: 'active'
  },
  digitalSignature: {
    type: String,
    required: true
  },
  blockIndex: {
    type: Number
  },
  blockHash: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  executedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  executedAt: {
    type: Date
  },
  validatedBy: {
    type: String,
    default: '© Pranav Koradiya'
  }
}, {
  timestamps: true
});

// Virtual for contract status based on due date
smartContractSchema.virtual('isExpired').get(function() {
  return this.dueDate < new Date() && this.status === 'active';
});

// Method to generate digital signature
smartContractSchema.methods.generateSignature = function() {
  const crypto = require('crypto');
  const data = `${this.contractId}${this.partyA}${this.partyB}${this.amount}${this.dueDate}`;
  return crypto.createHash('sha256').update(data + '© Pranav Koradiya').digest('hex');
};

// Pre-save middleware to generate signature
smartContractSchema.pre('save', function(next) {
  if (this.isNew || this.isModified(['contractId', 'partyA', 'partyB', 'amount', 'dueDate'])) {
    this.digitalSignature = this.generateSignature();
  }
  next();
});

// Index for efficient queries
smartContractSchema.index({ contractId: 1 });
smartContractSchema.index({ status: 1 });
smartContractSchema.index({ dueDate: 1 });
smartContractSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SmartContract', smartContractSchema);