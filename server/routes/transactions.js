const express = require('express');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// Get all transactions with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    if (req.query.accountType) {
      filter.accountType = req.query.accountType;
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.search) {
      filter.$or = [
        { description: { $regex: req.query.search, $options: 'i' } },
        { transactionId: { $regex: req.query.search, $options: 'i' } },
        { referenceId: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) {
        filter.createdAt.$gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        filter.createdAt.$lte = new Date(req.query.dateTo);
      }
    }

    // Get transactions
    const transactions = await Transaction.find(filter)
      .populate('createdBy', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: transactions.length,
          totalRecords: total
        }
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// Create new transaction
router.post('/', async (req, res) => {
  try {
    const {
      description,
      amount,
      debit = 0,
      credit = 0,
      accountType,
      referenceId
    } = req.body;

    // Validation
    if (!description || !amount || !accountType) {
      return res.status(400).json({
        success: false,
        message: 'Description, amount, and account type are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Set debit/credit based on account type
    let finalDebit = debit;
    let finalCredit = credit;
    
    if (debit === 0 && credit === 0) {
      if (['assets', 'expenses'].includes(accountType)) {
        finalDebit = amount;
      } else {
        finalCredit = amount;
      }
    }

    // Create transaction in blockchain
    const transactionData = {
      description,
      amount,
      debit: finalDebit,
      credit: finalCredit,
      accountType,
      referenceId: referenceId || '',
      createdBy: req.user._id.toString(),
      username: req.user.username
    };

    const blockchainResult = global.blockchain.addTransaction(transactionData);

    // Save transaction to database
    const transaction = await Transaction.create({
      transactionId: blockchainResult.transaction.id,
      description,
      amount,
      debit: finalDebit,
      credit: finalCredit,
      accountType,
      referenceId: referenceId || '',
      blockIndex: blockchainResult.block.index,
      blockHash: blockchainResult.block.hash,
      status: 'validated',
      signature: blockchainResult.transaction.signature,
      createdBy: req.user._id,
      ipAddress: req.ip
    });

    // Populate user info for response
    await transaction.populate('createdBy', 'username firstName lastName');

    // Create audit log
    await AuditLog.createLog({
      action: 'transaction_created',
      description: `New transaction created: ${description}`,
      entityType: 'transaction',
      entityId: transaction.transactionId,
      userId: req.user._id,
      username: req.user.username,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      metadata: {
        amount,
        accountType,
        blockIndex: blockchainResult.block.index
      }
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        transaction,
        block: {
          index: blockchainResult.block.index,
          hash: blockchainResult.block.hash,
          timestamp: blockchainResult.block.timestamp
        }
      }
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: error.message
    });
  }
});

// Get specific transaction
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      $or: [
        { _id: req.params.id },
        { transactionId: req.params.id }
      ]
    }).populate('createdBy', 'username firstName lastName');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Get the corresponding block from blockchain
    const block = global.blockchain.getBlock(transaction.blockIndex);

    res.json({
      success: true,
      data: {
        transaction,
        block: {
          index: block.index,
          hash: block.hash,
          prevHash: block.prevHash,
          timestamp: block.timestamp,
          validatedBy: block.validatedBy
        }
      }
    });

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction',
      error: error.message
    });
  }
});

// Get transaction statistics
router.get('/stats/summary', async (req, res) => {
  try {
    // Get transaction counts by status
    const statusStats = await Transaction.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get transactions by account type
    const accountTypeStats = await Transaction.aggregate([
      {
        $group: {
          _id: '$accountType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalDebit: { $sum: '$debit' },
          totalCredit: { $sum: '$credit' }
        }
      }
    ]);

    // Get monthly trends
    const monthlyStats = await Transaction.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get top users by transaction count
    const userStats = await Transaction.aggregate([
      {
        $group: {
          _id: '$createdBy',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          total: await Transaction.countDocuments(),
          totalAmount: await Transaction.aggregate([
            { $group: { _id: null, sum: { $sum: '$amount' } } }
          ]).then(result => result[0]?.sum || 0)
        },
        statusBreakdown: statusStats,
        accountTypeBreakdown: accountTypeStats,
        monthlyTrends: monthlyStats,
        topUsers: userStats.map(stat => ({
          user: `${stat.user.firstName} ${stat.user.lastName}`,
          username: stat.user.username,
          transactionCount: stat.count,
          totalAmount: stat.totalAmount
        }))
      }
    });

  } catch (error) {
    console.error('Transaction stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction statistics',
      error: error.message
    });
  }
});

// Export transactions to CSV (metadata)
router.get('/export/csv', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('createdBy', 'username firstName lastName')
      .sort({ createdAt: -1 });

    // Create CSV header
    const csvHeader = [
      'Transaction ID',
      'Description',
      'Amount',
      'Debit',
      'Credit',
      'Account Type',
      'Reference ID',
      'Status',
      'Block Index',
      'Block Hash',
      'Created By',
      'Created At',
      'Validated By'
    ].join(',');

    // Create CSV rows
    const csvRows = transactions.map(tx => [
      tx.transactionId,
      `"${tx.description}"`,
      tx.amount,
      tx.debit,
      tx.credit,
      tx.accountType,
      tx.referenceId || '',
      tx.status,
      tx.blockIndex,
      tx.blockHash,
      `"${tx.createdBy?.firstName} ${tx.createdBy?.lastName}"`,
      tx.createdAt.toISOString(),
      tx.validatedBy
    ].join(','));

    const csv = [csvHeader, ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csv);

  } catch (error) {
    console.error('Export transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export transactions',
      error: error.message
    });
  }
});

module.exports = router;