const crypto = require('crypto');

class Block {
  constructor(index, timestamp, data, prevHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.prevHash = prevHash;
    this.hash = this.calculateHash();
    this.validatedBy = '© Pranav Koradiya'; // Auto-fill validation
    this.nonce = 0; // For proof of work simulation
  }

  calculateHash() {
    return crypto.createHash('sha256')
      .update(this.index + this.prevHash + JSON.stringify(this.data) + this.timestamp + this.nonce)
      .digest('hex');
  }

  // Simulate proof of work (mining)
  mineBlock(difficulty = 2) {
    const target = Array(difficulty + 1).join('0');
    
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    
    console.log(`Block mined: ${this.hash}`);
  }

  // Get block summary for display
  getSummary() {
    return {
      index: this.index,
      timestamp: new Date(this.timestamp).toISOString(),
      hash: this.hash,
      prevHash: this.prevHash,
      validatedBy: this.validatedBy,
      transactionCount: Array.isArray(this.data) ? this.data.length : 1,
      dataSize: JSON.stringify(this.data).length
    };
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 100;
    this.totalTransactions = 0;
  }

  createGenesisBlock() {
    const genesisData = {
      type: 'genesis',
      message: 'Genesis Block – Blockchain Ledger System',
      creator: '© Pranav Koradiya',
      timestamp: new Date().toISOString()
    };
    
    return new Block(0, Date.now(), genesisData, '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  // Add transaction and create new block
  addTransaction(transactionData) {
    // Validate transaction data
    if (!transactionData.description || !transactionData.amount) {
      throw new Error('Transaction must include description and amount');
    }

    // Add metadata to transaction
    const enhancedTransaction = {
      ...transactionData,
      id: this.generateTransactionId(),
      timestamp: new Date().toISOString(),
      blockIndex: this.chain.length,
      status: 'validated',
      signature: this.generateSignature(transactionData)
    };

    // Create new block with transaction
    const newBlock = this.addBlock(enhancedTransaction);
    this.totalTransactions++;
    
    return {
      transaction: enhancedTransaction,
      block: newBlock
    };
  }

  // Add block to chain
  addBlock(data) {
    const prevBlock = this.getLatestBlock();
    const newBlock = new Block(
      this.chain.length,
      Date.now(),
      data,
      prevBlock.hash
    );
    
    // Simulate mining process
    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
    
    return newBlock;
  }

  // Validate entire blockchain
  isValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Check if current block's hash is valid
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return {
          valid: false,
          error: `Invalid hash at block ${i}`,
          blockIndex: i
        };
      }

      // Check if current block points to previous block
      if (currentBlock.prevHash !== previousBlock.hash) {
        return {
          valid: false,
          error: `Invalid previous hash at block ${i}`,
          blockIndex: i
        };
      }
    }

    return { valid: true, message: 'Blockchain integrity verified' };
  }

  // Get blockchain statistics
  getStats() {
    return {
      totalBlocks: this.chain.length,
      totalTransactions: this.totalTransactions,
      latestBlockHash: this.getLatestBlock().hash,
      chainValid: this.isValid().valid,
      difficulty: this.difficulty,
      createdBy: '© Pranav Koradiya'
    };
  }

  // Get all blocks with summary info
  getAllBlocks() {
    return this.chain.map(block => ({
      ...block.getSummary(),
      data: block.data
    }));
  }

  // Get specific block by index
  getBlock(index) {
    if (index < 0 || index >= this.chain.length) {
      throw new Error('Block index out of range');
    }
    return this.chain[index];
  }

  // Generate unique transaction ID
  generateTransactionId() {
    return crypto.randomBytes(16).toString('hex').toUpperCase();
  }

  // Generate transaction signature
  generateSignature(data) {
    const dataString = JSON.stringify(data);
    return crypto.createHash('sha256')
      .update(dataString + '© Pranav Koradiya')
      .digest('hex');
  }

  // Search transactions by criteria
  searchTransactions(criteria = {}) {
    const results = [];
    
    this.chain.forEach(block => {
      if (block.data && typeof block.data === 'object' && block.data.type !== 'genesis') {
        let matches = true;
        
        if (criteria.description && !block.data.description?.toLowerCase().includes(criteria.description.toLowerCase())) {
          matches = false;
        }
        
        if (criteria.accountType && block.data.accountType !== criteria.accountType) {
          matches = false;
        }
        
        if (criteria.dateFrom && new Date(block.data.timestamp) < new Date(criteria.dateFrom)) {
          matches = false;
        }
        
        if (criteria.dateTo && new Date(block.data.timestamp) > new Date(criteria.dateTo)) {
          matches = false;
        }
        
        if (matches) {
          results.push({
            blockIndex: block.index,
            transaction: block.data,
            blockHash: block.hash
          });
        }
      }
    });
    
    return results;
  }

  // Get recent transactions (last N blocks)
  getRecentTransactions(limit = 10) {
    return this.chain
      .slice(-limit)
      .filter(block => block.data.type !== 'genesis')
      .map(block => ({
        blockIndex: block.index,
        transaction: block.data,
        timestamp: block.timestamp,
        hash: block.hash
      }))
      .reverse();
  }
}

module.exports = { Block, Blockchain };