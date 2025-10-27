const express = require('express');
const AuditLog = require('../models/AuditLog');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Get audit logs with filtering and pagination
router.get('/', requireRole(['admin', 'auditor']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    if (req.query.action) {
      filter.action = req.query.action;
    }
    
    if (req.query.entityType) {
      filter.entityType = req.query.entityType;
    }
    
    if (req.query.severity) {
      filter.severity = req.query.severity;
    }
    
    if (req.query.username) {
      filter.username = { $regex: req.query.username, $options: 'i' };
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
    
    if (req.query.ipAddress) {
      filter.ipAddress = req.query.ipAddress;
    }

    // Get audit logs
    const auditLogs = await AuditLog.find(filter)
      .populate('userId', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      data: {
        auditLogs,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: auditLogs.length,
          totalRecords: total
        },
        filters: req.query
      }
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
});

// Get specific audit log
router.get('/:id', requireRole(['admin', 'auditor']), async (req, res) => {
  try {
    const auditLog = await AuditLog.findById(req.params.id)
      .populate('userId', 'username firstName lastName email');

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    res.json({
      success: true,
      data: {
        auditLog
      }
    });

  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log',
      error: error.message
    });
  }
});

// Get audit statistics
router.get('/stats/summary', requireRole(['admin', 'auditor']), async (req, res) => {
  try {
    // Get action counts
    const actionStats = await AuditLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get entity type counts
    const entityStats = await AuditLog.aggregate([
      {
        $group: {
          _id: '$entityType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get severity breakdown
    const severityStats = await AuditLog.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get most active users
    const userActivityStats = await AuditLog.aggregate([
      {
        $group: {
          _id: '$username',
          count: { $sum: 1 },
          lastActivity: { $max: '$createdAt' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get hourly activity (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hourlyActivity = await AuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: twentyFourHoursAgo }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get daily activity trends (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyTrends = await AuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get IP address activity
    const ipStats = await AuditLog.aggregate([
      {
        $group: {
          _id: '$ipAddress',
          count: { $sum: 1 },
          users: { $addToSet: '$username' },
          lastActivity: { $max: '$createdAt' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get failed operations
    const failedOperations = await AuditLog.find({
      status: 'failed'
    }).sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      data: {
        overview: {
          total: await AuditLog.countDocuments(),
          todayCount: await AuditLog.countDocuments({
            createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
          }),
          criticalCount: await AuditLog.countDocuments({ severity: 'critical' }),
          failedCount: await AuditLog.countDocuments({ status: 'failed' })
        },
        breakdown: {
          actions: actionStats,
          entities: entityStats,
          severity: severityStats,
          userActivity: userActivityStats,
          ipActivity: ipStats.map(ip => ({
            ...ip,
            userCount: ip.users.length
          }))
        },
        trends: {
          hourly: hourlyActivity,
          daily: dailyTrends
        },
        alerts: {
          failedOperations: failedOperations.map(log => ({
            id: log._id,
            action: log.action,
            description: log.description,
            username: log.username,
            createdAt: log.createdAt,
            severity: log.severity
          }))
        }
      }
    });

  } catch (error) {
    console.error('Audit stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit statistics',
      error: error.message
    });
  }
});

// Export audit logs to CSV
router.get('/export/csv', requireRole(['admin', 'auditor']), async (req, res) => {
  try {
    // Apply same filters as GET route
    const filter = {};
    if (req.query.dateFrom) {
      filter.createdAt = { $gte: new Date(req.query.dateFrom) };
    }
    if (req.query.dateTo) {
      filter.createdAt = { ...filter.createdAt, $lte: new Date(req.query.dateTo) };
    }

    const auditLogs = await AuditLog.find(filter)
      .populate('userId', 'username firstName lastName')
      .sort({ createdAt: -1 });

    // Create CSV header
    const csvHeader = [
      'Timestamp',
      'Action',
      'Description',
      'Entity Type',
      'Entity ID',
      'Username',
      'User Full Name',
      'IP Address',
      'Severity',
      'Status',
      'Signature'
    ].join(',');

    // Create CSV rows
    const csvRows = auditLogs.map(log => [
      log.createdAt.toISOString(),
      log.action,
      `"${log.description.replace(/"/g, '""')}"`, // Escape quotes
      log.entityType,
      log.entityId,
      log.username,
      `"${log.userId ? (log.userId.firstName + ' ' + log.userId.lastName) : 'N/A'}"`,
      log.ipAddress,
      log.severity,
      log.status,
      log.signature.substring(0, 16) + '...' // Truncate signature for readability
    ].join(','));

    const csv = [csvHeader, ...csvRows].join('\n');

    // Create audit log for export action
    await AuditLog.createLog({
      action: 'data_export',
      description: `Audit logs exported to CSV (${auditLogs.length} records)`,
      entityType: 'system',
      entityId: 'audit-export',
      userId: req.user._id,
      username: req.user.username,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      severity: 'medium',
      metadata: {
        exportCount: auditLogs.length,
        dateRange: req.query
      }
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);

  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export audit logs',
      error: error.message
    });
  }
});

// Get audit trail for specific entity
router.get('/entity/:type/:id', requireRole(['admin', 'auditor']), async (req, res) => {
  try {
    const { type, id } = req.params;
    
    const auditTrail = await AuditLog.find({
      entityType: type,
      entityId: id
    })
      .populate('userId', 'username firstName lastName')
      .sort({ createdAt: 1 }); // Chronological order for trail

    if (auditTrail.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No audit trail found for this entity'
      });
    }

    res.json({
      success: true,
      data: {
        entityType: type,
        entityId: id,
        trailCount: auditTrail.length,
        auditTrail: auditTrail.map(log => ({
          timestamp: log.createdAt,
          action: log.action,
          description: log.description,
          username: log.username,
          userFullName: log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : 'N/A',
          ipAddress: log.ipAddress,
          severity: log.severity,
          status: log.status,
          metadata: log.metadata
        }))
      }
    });

  } catch (error) {
    console.error('Get audit trail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit trail',
      error: error.message
    });
  }
});

module.exports = router;