const AuditLog = require('../models/AuditLog');

const auditMiddleware = (req, res, next) => {
  // Skip audit for health check and auth endpoints
  if (req.path === '/health' || req.path.startsWith('/api/auth/login')) {
    return next();
  }

  const originalSend = res.send;
  
  res.send = function(data) {
    // Log the API call
    const logData = {
      action: getActionFromRequest(req),
      description: `${req.method} ${req.path}`,
      entityType: getEntityTypeFromPath(req.path),
      entityId: req.params.id || req.body.id || 'system',
      userId: req.user?._id,
      username: req.user?.username || 'anonymous',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      severity: getSeverityFromMethod(req.method),
      status: res.statusCode < 400 ? 'success' : 'failed',
      metadata: {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        requestBody: sanitizeRequestBody(req.body),
        query: req.query
      }
    };

    // Create audit log asynchronously
    AuditLog.createLog(logData).catch(error => {
      console.error('Failed to create audit log:', error);
    });

    originalSend.call(this, data);
  };

  next();
};

const getActionFromRequest = (req) => {
  const path = req.path.toLowerCase();
  const method = req.method.toLowerCase();
  
  if (path.includes('transaction')) {
    return method === 'post' ? 'transaction_created' : 'transaction_updated';
  }
  if (path.includes('contract')) {
    return method === 'post' ? 'contract_created' : 'contract_executed';
  }
  if (path.includes('blockchain')) {
    return 'blockchain_verified';
  }
  if (path.includes('audit')) {
    return 'data_export';
  }
  
  return 'system_access';
};

const getEntityTypeFromPath = (path) => {
  if (path.includes('transaction')) return 'transaction';
  if (path.includes('contract')) return 'contract';
  if (path.includes('block')) return 'block';
  if (path.includes('user')) return 'user';
  return 'system';
};

const getSeverityFromMethod = (method) => {
  switch (method.toLowerCase()) {
    case 'delete': return 'high';
    case 'post': return 'medium';
    case 'put':
    case 'patch': return 'medium';
    default: return 'low';
  }
};

const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.secret;
  
  return sanitized;
};

module.exports = auditMiddleware;