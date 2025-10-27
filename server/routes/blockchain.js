const express = require('express');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// Get all blocks with detailed information
router.get('/blocks', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const blockchain = global.blockchain;
    
    const allBlocks = blockchain.getAllBlocks();
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBlocks = allBlocks.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        blocks: paginatedBlocks,
        pagination: {
          current: page,
          total: Math.ceil(allBlocks.length / limit),
          count: paginatedBlocks.length,
          totalRecords: allBlocks.length
        },
        chainStats: blockchain.getStats()
      }
    });

  } catch (error) {
    console.error('Get blocks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blocks',
      error: error.message
    });
  }
});

// Get specific block by index
router.get('/blocks/:index', async (req, res) => {
  try {
    const blockIndex = parseInt(req.params.index);
    const blockchain = global.blockchain;
    
    if (blockIndex < 0 || blockIndex >= blockchain.chain.length) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }
    
    const block = blockchain.getBlock(blockIndex);
    
    // Get next and previous block info
    const nextBlock = blockIndex < blockchain.chain.length - 1 ? 
      blockchain.getBlock(blockIndex + 1).getSummary() : null;
    const prevBlock = blockIndex > 0 ? 
      blockchain.getBlock(blockIndex - 1).getSummary() : null;
    
    res.json({
      success: true,
      data: {
        block: {
          ...block,
          dataSize: JSON.stringify(block.data).length,
          isGenesis: blockIndex === 0
        },
        navigation: {
          previous: prevBlock,
          next: nextBlock
        }
      }
    });

  } catch (error) {
    console.error('Get block error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch block',
      error: error.message
    });
  }
});

// Verify blockchain integrity
router.get('/verify', async (req, res) => {
  try {
    const blockchain = global.blockchain;
    const integrity = blockchain.isValid();
    
    // Create detailed verification report
    const verificationReport = {
      overallStatus: integrity.valid,
      totalBlocks: blockchain.chain.length,
      verifiedAt: new Date().toISOString(),
      verifiedBy: req.user.username,
      details: []
    };
    
    // Verify each block individually
    for (let i = 1; i < blockchain.chain.length; i++) {
      const currentBlock = blockchain.chain[i];
      const previousBlock = blockchain.chain[i - 1];
      
      const blockVerification = {
        blockIndex: i,
        hashValid: currentBlock.hash === currentBlock.calculateHash(),
        linkValid: currentBlock.prevHash === previousBlock.hash,
        timestamp: currentBlock.timestamp,
        status: 'valid'
      };
      
      if (!blockVerification.hashValid) {
        blockVerification.status = 'invalid';
        blockVerification.error = 'Hash mismatch';
      } else if (!blockVerification.linkValid) {
        blockVerification.status = 'invalid';
        blockVerification.error = 'Previous hash mismatch';
      }
      
      verificationReport.details.push(blockVerification);
    }
    
    // Create audit log for verification
    await AuditLog.createLog({
      action: 'blockchain_verified',
      description: `Blockchain integrity verification: ${integrity.valid ? 'PASSED' : 'FAILED'}`,
      entityType: 'blockchain',
      entityId: 'main-chain',
      userId: req.user._id,
      username: req.user.username,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      severity: integrity.valid ? 'low' : 'critical',
      metadata: {
        totalBlocks: blockchain.chain.length,
        result: integrity
      }
    });
    
    res.json({
      success: true,
      data: {
        verification: verificationReport,
        integrity,
        chainStats: blockchain.getStats()
      }
    });

  } catch (error) {
    console.error('Blockchain verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify blockchain',
      error: error.message
    });
  }
});

// Get blockchain statistics
router.get('/stats', async (req, res) => {
  try {
    const blockchain = global.blockchain;
    const stats = blockchain.getStats();
    
    // Additional statistics
    const blockSizes = blockchain.chain.map(block => ({
      index: block.index,
      size: JSON.stringify(block).length,
      transactionCount: Array.isArray(block.data) ? block.data.length : 1
    }));
    
    const avgBlockSize = blockSizes.reduce((sum, block) => sum + block.size, 0) / blockSizes.length;
    
    res.json({
      success: true,
      data: {
        ...stats,
        blockSizes,
        averageBlockSize: Math.round(avgBlockSize),
        chainLength: blockchain.chain.length,
        genesisBlock: blockchain.chain[0].getSummary(),
        latestBlock: blockchain.getLatestBlock().getSummary()
      }
    });

  } catch (error) {
    console.error('Blockchain stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blockchain statistics',
      error: error.message
    });
  }
});

// Search blockchain for transactions
router.get('/search', async (req, res) => {
  try {
    const { query, accountType, dateFrom, dateTo } = req.query;
    
    if (!query && !accountType && !dateFrom && !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'At least one search criteria is required'
      });
    }
    
    const blockchain = global.blockchain;
    const searchCriteria = {};
    
    if (query) searchCriteria.description = query;
    if (accountType) searchCriteria.accountType = accountType;
    if (dateFrom) searchCriteria.dateFrom = dateFrom;
    if (dateTo) searchCriteria.dateTo = dateTo;
    
    const results = blockchain.searchTransactions(searchCriteria);
    
    res.json({
      success: true,
      data: {
        results,
        searchCriteria,
        totalResults: results.length,
        searchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Blockchain search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search blockchain',
      error: error.message
    });
  }
});

// Get blockchain network visualization data
router.get('/network', async (req, res) => {
  try {
    const blockchain = global.blockchain;
    const blocks = blockchain.getAllBlocks();
    
    // Create network graph data
    const nodes = blocks.map(block => ({
      id: `block-${block.index}`,
      label: `Block ${block.index}`,
      type: block.index === 0 ? 'genesis' : 'regular',
      hash: block.hash,
      timestamp: block.timestamp,
      transactionCount: Array.isArray(block.data) ? block.data.length : 1,
      size: JSON.stringify(block).length
    }));
    
    const edges = [];
    for (let i = 1; i < blocks.length; i++) {
      edges.push({
        id: `edge-${i}`,
        source: `block-${i - 1}`,
        target: `block-${i}`,
        label: 'hash link'
      });
    }
    
    res.json({
      success: true,
      data: {
        nodes,
        edges,
        metadata: {
          totalNodes: nodes.length,
          totalEdges: edges.length,
          networkHealth: blockchain.isValid().valid ? 'healthy' : 'compromised'
        }
      }
    });

  } catch (error) {
    console.error('Network visualization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate network data',
      error: error.message
    });
  }
});

module.exports = router;