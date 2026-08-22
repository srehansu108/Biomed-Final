// Validate required fields
export const validateRequired = (value, fieldName) => {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
};

// Validate email
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!regex.test(email)) return 'Please provide a valid email address';
  return null;
};

// Validate phone
export const validatePhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  if (!phone) return 'Phone number is required';
  if (digits.length !== 10) return 'Phone number must be 10 digits';
  return null;
};

// Validate password
export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
};

// Validate confirm password
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

// Validate finger type
export const validateFingerType = (fingerType) => {
  const validTypes = [
    'right_thumb', 'right_index', 'right_middle', 'right_ring', 'right_little',
    'left_thumb', 'left_index', 'left_middle', 'left_ring', 'left_little'
  ];
  if (!fingerType) return 'Finger type is required';
  if (!validTypes.includes(fingerType)) return 'Invalid finger type';
  return null;
};

// Validate fingerprint data
export const validateFingerprintData = (data) => {
  if (!data) return 'Fingerprint data is required';
  if (typeof data !== 'string') return 'Invalid fingerprint data format';
  if (data.length < 10) return 'Invalid fingerprint data';
  return null;
};

// Validate quality score
export const validateQualityScore = (score) => {
  if (score === undefined || score === null) return 'Quality score is required';
  if (typeof score !== 'number') return 'Quality score must be a number';
  if (score < 0 || score > 100) return 'Quality score must be between 0 and 100';
  return null;
};

// Validate URL
export const validateUrl = (url) => {
  try {
    new URL(url);
    return null;
  } catch {
    return 'Invalid URL';
  }
};

// Validate date
export const validateDate = (date, fieldName = 'Date') => {
  if (!date) return `${fieldName} is required`;
  const d = new Date(date);
  if (isNaN(d.getTime())) return `Invalid ${fieldName}`;
  return null;
};

// Validate age (minimum 18 years)
export const validateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  if (age < 18) return 'Must be at least 18 years old';
  return null;
};