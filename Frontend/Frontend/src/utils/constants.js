export const FINGER_TYPES = {
  RIGHT_THUMB: 'right_thumb',
  RIGHT_INDEX: 'right_index',
  RIGHT_MIDDLE: 'right_middle',
  RIGHT_RING: 'right_ring',
  RIGHT_LITTLE: 'right_little',
  LEFT_THUMB: 'left_thumb',
  LEFT_INDEX: 'left_index',
  LEFT_MIDDLE: 'left_middle',
  LEFT_RING: 'left_ring',
  LEFT_LITTLE: 'left_little',
};

export const FINGER_NAMES = {
  [FINGER_TYPES.RIGHT_THUMB]: 'Right Thumb',
  [FINGER_TYPES.RIGHT_INDEX]: 'Right Index',
  [FINGER_TYPES.RIGHT_MIDDLE]: 'Right Middle',
  [FINGER_TYPES.RIGHT_RING]: 'Right Ring',
  [FINGER_TYPES.RIGHT_LITTLE]: 'Right Little',
  [FINGER_TYPES.LEFT_THUMB]: 'Left Thumb',
  [FINGER_TYPES.LEFT_INDEX]: 'Left Index',
  [FINGER_TYPES.LEFT_MIDDLE]: 'Left Middle',
  [FINGER_TYPES.LEFT_RING]: 'Left Ring',
  [FINGER_TYPES.LEFT_LITTLE]: 'Left Little',
};

export const USER_ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  USER: 'user',
};

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending_verification',
};

export const QUALITY_THRESHOLDS = {
  EXCELLENT: 85,
  GOOD: 70,
  FAIR: 50,
  POOR: 30,
};

export const VERIFICATION_TYPES = {
  ONE_TO_ONE: '1:1',
  ONE_TO_MANY: '1:N',
  MANY_TO_ONE: 'N:1',
  MANY_TO_MANY: 'N:N',
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

export const MESSAGES = {
  // Auth
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logged out successfully',
  REGISTER_SUCCESS: 'Registration successful',
  PROFILE_UPDATED: 'Profile updated successfully',
  
  // Fingerprint
  FINGERPRINT_CAPTURED: 'Fingerprint captured successfully',
  FINGERPRINT_ENROLLED: 'Fingerprint enrolled successfully',
  FINGERPRINT_DELETED: 'Fingerprint deleted successfully',
  FINGERPRINT_VERIFIED: 'Fingerprint verified successfully',
  
  // Errors
  AUTH_REQUIRED: 'Authentication required',
  INVALID_CREDENTIALS: 'Invalid credentials',
  ACCESS_DENIED: 'Access denied',
  NOT_FOUND: 'Resource not found',
  SERVER_ERROR: 'Internal server error',
};