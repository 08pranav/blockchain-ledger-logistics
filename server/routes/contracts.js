const express = require('express');
const SmartContract = require('../models/SmartContract');
const AuditLog = require('../models/AuditLog');
const crypto = require('crypto');

const router = express.Router();

// Get all smart contracts with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.search) {
      filter.$or = [
        { contractId: { $regex: req.query.search, $options: 'i' } },
        { partyA: { $regex: req.query.search, $options: 'i' } },
        { partyB: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    if (req.query.dueDateFrom || req.query.dueDateTo) {
      filter.dueDate = {};
      if (req.query.dueDateFrom) {
        filter.dueDate.$gte = new Date(req.query.dueDateFrom);
      }
      if (req.query.dueDateTo) {
        filter.dueDate.$lte = new Date(req.query.dueDateTo);
      }
    }

    // Get contracts
    const contracts = await SmartContract.find(filter)
      .populate('createdBy', 'username firstName lastName')
      .populate('executedBy', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SmartContract.countDocuments(filter);

    // Check for expired contracts and update status
    const now = new Date();
    const expiredContracts = await SmartContract.updateMany(
      { dueDate: { $lt: now }, status: 'active' },
      { status: 'expired' }
    );

    res.json({
      success: true,
      data: {
        contracts: contracts.map(contract => ({
          ...contract.toJSON(),
          isExpired: contract.dueDate < now && contract.status === 'active'
        })),
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: contracts.length,
          totalRecords: total
        },
        expiredUpdated: expiredContracts.modifiedCount
      }
    });

  } catch (error) {
    console.error('Get contracts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contracts',
      error: error.message
    });
  }
});

// Create new smart contract
router.post('/', async (req, res) => {
  try {
    const {
      contractId,
      partyA,
      partyB,
      amount,
      currency = 'USD',
      dueDate,
      description,
      terms = ''
    } = req.body;

    // Validation
    if (!contractId || !partyA || !partyB || !amount || !dueDate || !description) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    if (new Date(dueDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Due date must be in the future'
      });
    }

    // Check if contract ID already exists
    const existingContract = await SmartContract.findOne({ contractId });
    if (existingContract) {
      return res.status(400).json({
        success: false,
        message: 'Contract ID already exists'
      });
    }

    // Create contract object
    const contractData = {
      contractId,
      partyA,
      partyB,
      amount,
      currency,
      dueDate: new Date(dueDate),
      description,
      terms,
      createdBy: req.user._id
    };

    // Generate digital signature
    const signatureData = `${contractId}${partyA}${partyB}${amount}${dueDate}`;
    const digitalSignature = crypto.createHash('sha256')
      .update(signatureData + '© Pranav Koradiya')
      .digest('hex');

    contractData.digitalSignature = digitalSignature;

    // Add to blockchain
    const blockchainData = {
      type: 'smart_contract',
      ...contractData,
      createdBy: req.user.username,
      timestamp: new Date().toISOString()
    };

    const blockchainResult = global.blockchain.addTransaction(blockchainData);
    contractData.blockIndex = blockchainResult.block.index;
    contractData.blockHash = blockchainResult.block.hash;

    // Save contract to database
    const contract = await SmartContract.create(contractData);
    await contract.populate('createdBy', 'username firstName lastName');

    // Create audit log
    await AuditLog.createLog({
      action: 'contract_created',
      description: `Smart contract created: ${contractId} between ${partyA} and ${partyB}`,
      entityType: 'contract',
      entityId: contract.contractId,
      userId: req.user._id,
      username: req.user.username,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      metadata: {
        amount,
        currency,
        dueDate,
        blockIndex: blockchainResult.block.index
      }
    });

    res.status(201).json({
      success: true,
      message: 'Smart contract created successfully',
      data: {
        contract,
        blockchain: {
          blockIndex: blockchainResult.block.index,
          blockHash: blockchainResult.block.hash,
          signature: digitalSignature
        }
      }
    });

  } catch (error) {
    console.error('Create contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contract',
      error: error.message
    });
  }
});

// Get specific contract
router.get('/:id', async (req, res) => {
  try {
    const contract = await SmartContract.findOne({
      $or: [
        { _id: req.params.id },
        { contractId: req.params.id }
      ]
    })
      .populate('createdBy', 'username firstName lastName')
      .populate('executedBy', 'username firstName lastName');

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Get blockchain information if available
    let blockchainInfo = null;
    if (contract.blockIndex !== undefined) {
      try {
        const block = global.blockchain.getBlock(contract.blockIndex);
        blockchainInfo = {
          blockIndex: block.index,
          blockHash: block.hash,
          timestamp: block.timestamp,
          validatedBy: block.validatedBy
        };
      } catch (blockError) {
        console.warn('Block not found for contract:', contract.contractId);
      }
    }

    res.json({
      success: true,
      data: {
        contract: {
          ...contract.toJSON(),
          isExpired: contract.dueDate < new Date()
        },
        blockchain: blockchainInfo
      }
    });

  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contract',
      error: error.message
    });
  }
});

// Execute/Complete a contract
router.post('/:id/execute', async (req, res) => {
  try {
    const contract = await SmartContract.findOne({
      $or: [
        { _id: req.params.id },
        { contractId: req.params.id }
      ]
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    if (contract.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Contract cannot be executed. Current status: ${contract.status}`
      });
    }

    if (contract.dueDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Contract has expired and cannot be executed'
      });
    }

    // Update contract status
    contract.status = 'completed';
    contract.executedBy = req.user._id;
    contract.executedAt = new Date();
    
    await contract.save();
    await contract.populate(['createdBy', 'executedBy'], 'username firstName lastName');

    // Add execution record to blockchain
    const executionData = {
      type: 'contract_execution',
      contractId: contract.contractId,
      executedBy: req.user.username,
      executionDate: new Date().toISOString(),
      amount: contract.amount,
      parties: [contract.partyA, contract.partyB]
    };

    global.blockchain.addTransaction(executionData);

    // Create audit log
    await AuditLog.createLog({
      action: 'contract_executed',
      description: `Smart contract executed: ${contract.contractId}`,
      entityType: 'contract',
      entityId: contract.contractId,
      userId: req.user._id,
      username: req.user.username,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      severity: 'medium',
      metadata: {
        amount: contract.amount,
        originalDueDate: contract.dueDate,
        executionDate: contract.executedAt
      }
    });

    res.json({
      success: true,
      message: 'Contract executed successfully',
      data: {
        contract
      }
    });

  } catch (error) {
    console.error('Execute contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute contract',
      error: error.message
    });
  }
});

// Cancel a contract
router.post('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const contract = await SmartContract.findOne({
      $or: [
        { _id: req.params.id },
        { contractId: req.params.id }
      ]
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    if (contract.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Contract cannot be cancelled. Current status: ${contract.status}`
      });
    }

    // Update contract status
    contract.status = 'cancelled';
    contract.executedBy = req.user._id;
    contract.executedAt = new Date();
    
    if (reason) {
      contract.terms += `\n\nCancellation Reason: ${reason}`;
    }
    
    await contract.save();
    await contract.populate(['createdBy', 'executedBy'], 'username firstName lastName');

    // Add cancellation record to blockchain
    const cancellationData = {
      type: 'contract_cancellation',
      contractId: contract.contractId,
      cancelledBy: req.user.username,
      cancellationDate: new Date().toISOString(),
      reason: reason || 'No reason provided'
    };

    global.blockchain.addTransaction(cancellationData);

    // Create audit log
    await AuditLog.createLog({
      action: 'contract_cancelled',
      description: `Smart contract cancelled: ${contract.contractId}${reason ? ` - Reason: ${reason}` : ''}`,
      entityType: 'contract',
      entityId: contract.contractId,
      userId: req.user._id,
      username: req.user.username,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      severity: 'medium',
      metadata: {
        reason,
        cancellationDate: contract.executedAt
      }
    });

    res.json({
      success: true,
      message: 'Contract cancelled successfully',
      data: {
        contract
      }
    });

  } catch (error) {
    console.error('Cancel contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel contract',
      error: error.message
    });
  }
});

// Get contract statistics
router.get('/stats/summary', async (req, res) => {
  try {
    // Get contract counts by status
    const statusStats = await SmartContract.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$amount' }
        }
      }
    ]);

    // Get contracts by currency
    const currencyStats = await SmartContract.aggregate([
      {
        $group: {
          _id: '$currency',
          count: { $sum: 1 },
          totalValue: { $sum: '$amount' }
        }
      }
    ]);

    // Get upcoming due dates (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingContracts = await SmartContract.find({
      dueDate: {
        $gte: new Date(),
        $lte: thirtyDaysFromNow
      },
      status: 'active'
    }).sort({ dueDate: 1 }).limit(10);

    // Get monthly contract creation trends
    const monthlyStats = await SmartContract.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalValue: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          total: await SmartContract.countDocuments(),
          totalValue: await SmartContract.aggregate([
            { $group: { _id: null, sum: { $sum: '$amount' } } }
          ]).then(result => result[0]?.sum || 0)
        },
        statusBreakdown: statusStats,
        currencyBreakdown: currencyStats,
        upcomingContracts: upcomingContracts.map(contract => ({
          contractId: contract.contractId,
          partyA: contract.partyA,
          partyB: contract.partyB,
          amount: contract.amount,
          currency: contract.currency,
          dueDate: contract.dueDate,
          daysUntilDue: Math.ceil((contract.dueDate - new Date()) / (1000 * 60 * 60 * 24))
        })),
        monthlyTrends: monthlyStats
      }
    });

  } catch (error) {
    console.error('Contract stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contract statistics',
      error: error.message
    });
  }
});

module.exports = router;