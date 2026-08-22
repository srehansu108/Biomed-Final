const AuditLog = require('../models/AuditLog');

class AuditService {
  async log({ userId, action, status, req = null, details = {} }) {
    try {
      const auditLog = new AuditLog({
        userId,
        action,
        status,
        ipAddress: req?.ip || req?.connection?.remoteAddress || req?.socket?.remoteAddress || '0.0.0.0',
        userAgent: req?.headers?.['user-agent'] || 'Unknown',
        deviceId: req?.headers?.['x-device-id'] || null,
        sessionId: req?.headers?.['x-session-id'] || null,
        details,
        timestamp: new Date()
      });

      await auditLog.save();
      return auditLog;
    } catch (error) {
      console.error('Audit log error:', error);
      return null;
    }
  }

  async logSecurityAlert({ userId, action, details = {}, severity = 'warning' }) {
    return this.log({
      userId,
      action,
      status: 'warning',
      details: { ...details, severity, alert: true },
      req: null
    });
  }

  async getUserLogs(userId, limit = 50, skip = 0) {
    try {
      const logs = await AuditLog.find({ userId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

      const total = await AuditLog.countDocuments({ userId });

      return {
        logs: logs.map(log => log.sanitize()),
        total,
        page: Math.floor(skip / limit) + 1,
        pages: Math.ceil(total / limit),
        limit
      };
    } catch (error) {
      console.error('Get audit logs error:', error);
      return { logs: [], total: 0, page: 1, pages: 1, limit };
    }
  }

  async getAllLogs(filters = {}, limit = 50, skip = 0) {
    try {
      const query = {};
      
      if (filters.userId) query.userId = filters.userId;
      if (filters.action) query.action = filters.action;
      if (filters.status) query.status = filters.status;
      if (filters.severity) query.severity = filters.severity;
      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
        if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
      }

      const logs = await AuditLog.find(query)
        .populate('userId', 'fullName email')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

      const total = await AuditLog.countDocuments(query);

      return {
        logs: logs.map(log => log.sanitize()),
        total,
        page: Math.floor(skip / limit) + 1,
        pages: Math.ceil(total / limit),
        limit
      };
    } catch (error) {
      console.error('Get all logs error:', error);
      return { logs: [], total: 0, page: 1, pages: 1, limit };
    }
  }

  async getStats() {
    try {
      const stats = await AuditLog.getStats();
      const total = await AuditLog.countDocuments();
      const success = await AuditLog.countDocuments({ status: 'success' });
      const failure = await AuditLog.countDocuments({ status: 'failure' });

      return {
        total,
        success,
        failure,
        successRate: total > 0 ? (success / total * 100).toFixed(2) : 0,
        byAction: stats,
        recent: await AuditLog.findRecent(10)
      };
    } catch (error) {
      console.error('Get stats error:', error);
      return { total: 0, success: 0, failure: 0, successRate: 0, byAction: [], recent: [] };
    }
  }

  async cleanupOldLogs(days = 90) {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      
      const result = await AuditLog.deleteMany({
        timestamp: { $lt: cutoff }
      });
      
      return result;
    } catch (error) {
      console.error('Cleanup logs error:', error);
      return null;
    }
  }
}

module.exports = new AuditService();