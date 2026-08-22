module.exports = {
  // User roles
  USER_ROLES: {
    ADMIN: 'admin',
    EMPLOYEE: 'employee',
    USER: 'user'
  },

  // User statuses
  USER_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    PENDING: 'pending_verification'
  },

  // Audit actions
  AUDIT_ACTIONS: {
    LOGIN: 'login',
    LOGOUT: 'logout',
    REGISTER: 'register',
    FINGERPRINT_CAPTURE: 'fingerprint_capture',
    FINGERPRINT_VERIFY: 'fingerprint_verify',
    FINGERPRINT_DELETE: 'fingerprint_delete',
    PROFILE_UPDATE: 'profile_update',
    ACCOUNT_LOCK: 'account_lock',
    ACCOUNT_UNLOCK: 'account_unlock'
  },

  // HTTP status codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500
  },

  // Messages
  MESSAGES: {
    USER_REGISTERED: 'User registered successfully',
    USER_LOGIN: 'Login successful',
    USER_LOGOUT: 'Logged out successfully',
    USER_UPDATED: 'Profile updated successfully',
    USER_DELETED: 'User deleted successfully',
    FINGERPRINT_CAPTURED: 'Fingerprint captured successfully',
    FINGERPRINT_ENROLLED: 'Fingerprint enrolled successfully',
    FINGERPRINT_DELETED: 'Fingerprint deleted successfully',
    FINGERPRINT_VERIFIED: 'Fingerprint verified successfully',
    TOKEN_REFRESHED: 'Token refreshed successfully',
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Insufficient permissions',
    NOT_FOUND: 'Resource not found'
  }
};