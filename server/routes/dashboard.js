const express = require('express');
const Transaction = require('../models/Transaction');
const SmartContract = require('../models/SmartContract');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// Get dashboard statistics
router.get('/', async (req, res) => {
  try {
    const blockchain = global.blockchain;
    
    // Get blockchain stats
    const blockchainStats = blockchain.getStats();
    
    // Get database stats
    const [transactionCount, contractCount, auditLogCount] = await Promise.all([
      Transaction.countDocuments(),
      SmartContract.countDocuments(),
      AuditLog.countDocuments()
    ]);

    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .populate('createdBy', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get contract statistics
    const contractStats = await SmartContract.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get transaction statistics by account type
    const transactionsByType = await Transaction.aggregate([
      {
        $group: {
          _id: '$accountType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get monthly transaction trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
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
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Calculate system health indicators
    const systemHealth = {
      blockchain: {
        status: blockchainStats.chainValid ? 'healthy' : 'compromised',
        blocks: blockchainStats.totalBlocks,
        lastBlockTime: blockchain.getLatestBlock().timestamp
      },
      database: {
        status: 'connected',
        transactions: transactionCount,
        contracts: contractCount,
        auditLogs: auditLogCount
      },
      security: {
        activeUsers: 1, // Could be enhanced with session tracking
        recentLogins: await AuditLog.countDocuments({
          action: 'user_login',
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          })
      }
    };

    res.json({
      success: true,
      data: {
        overview: {
          totalBlocks: blockchainStats.totalBlocks,
          totalTransactions: transactionCount,
          totalContracts: contractCount,
          chainIntegrity: blockchainStats.chainValid ? 'Valid' : 'Compromised',
          developer: blockchainStats.createdBy
        },
        blockchain: blockchainStats,
        recentTransactions: recentTransactions.map(tx => ({
          id: tx.transactionId,
          description: tx.description,
          amount: tx.amount,
          accountType: tx.accountType,
          status: tx.status,
          createdBy: tx.createdBy?.firstName + ' ' + tx.createdBy?.lastName,
          createdAt: tx.createdAt,
          blockIndex: tx.blockIndex
        })),
        statistics: {
          contractsByStatus: contractStats,
          transactionsByType,
          monthlyTrends
        },
        systemHealth
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data',
      error: error.message
    });
  }
});

// Get real-time blockchain visualization data
router.get('/blockchain-visual', async (req, res) => {
  try {
    const blockchain = global.blockchain;
    const blocks = blockchain.getAllBlocks();
    
    // Format blocks for visualization
    const visualData = blocks.map((block, index) => ({
      id: block.index,
      hash: block.hash.substring(0, 8) + '...',
      prevHash: block.prevHash ? block.prevHash.substring(0, 8) + '...' : 'Genesis',
      timestamp: new Date(block.timestamp).toLocaleTimeString(),
      transactions: Array.isArray(block.data) ? block.data.length : 1,
      status: 'validated',
      connections: index > 0 ? [index - 1] : []
    }));

    res.json({
      success: true,
      data: {
        blocks: visualData,
        integrity: blockchain.isValid(),
        totalHash: blockchain.getLatestBlock().hash
      }
    });

  } catch (error) {
    console.error('Blockchain visual error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load blockchain visualization',
      error: error.message
    });
  }
});

// Get system alerts and notifications
router.get('/alerts', async (req, res) => {
  try {
    const alerts = [];
    
    // Check blockchain integrity
    const integrity = global.blockchain.isValid();
    if (!integrity.valid) {
      alerts.push({
        type: 'critical',
        title: 'Blockchain Integrity Compromised',
        message: integrity.error,
        timestamp: new Date().toISOString()
      });
    }

    // Check for expired contracts
    const expiredContracts = await SmartContract.countDocuments({
      dueDate: { $lt: new Date() },
      status: 'active'
    });

    if (expiredContracts > 0) {
      alerts.push({
        type: 'warning',
        title: 'Expired Contracts',
        message: `${expiredContracts} contract(s) have expired and need attention`,
        timestamp: new Date().toISOString()
      });
    }

    // Check for high-value transactions (last 24h)
    const highValueTransactions = await Transaction.countDocuments({
      amount: { $gt: 10000 },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (highValueTransactions > 0) {
      alerts.push({
        type: 'info',
        title: 'High-Value Transactions',
        message: `${highValueTransactions} high-value transaction(s) recorded in the last 24 hours`,
        timestamp: new Date().toISOString()
      });
    }

    // Check recent failed audit logs
    const failedActions = await AuditLog.countDocuments({
      status: 'failed',
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    });

    if (failedActions > 0) {
      alerts.push({
        type: 'warning',
        title: 'Failed Operations',
        message: `${failedActions} operation(s) failed in the last hour`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: {
        alerts,
        alertCount: alerts.length,
        lastChecked: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load alerts',
      error: error.message
    });
  }
});

module.exports = router;