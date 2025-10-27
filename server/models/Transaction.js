const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  debit: {
    type: Number,
    default: 0,
    min: 0
  },
  credit: {
    type: Number,
    default: 0,
    min: 0
  },
  accountType: {
    type: String,
    enum: ['assets', 'liabilities', 'equity', 'revenue', 'expenses'],
    required: true
  },
  referenceId: {
    type: String,
    trim: true
  },
  blockIndex: {
    type: Number,
    required: true
  },
  blockHash: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'validated', 'failed'],
    default: 'pending'
  },
  signature: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  validatedBy: {
    type: String,
    default: '© Pranav Koradiya'
  },
  ipAddress: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
transactionSchema.index({ blockIndex: 1 });
transactionSchema.index({ accountType: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ transactionId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);