// Format date
export const formatDate = (date, format = 'MMM DD, YYYY') => {
  if (!date) return '';
  const d = new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const replacements = {
    'YYYY': d.getFullYear(),
    'YY': d.getFullYear().toString().slice(-2),
    'MM': String(d.getMonth() + 1).padStart(2, '0'),
    'MMM': months[d.getMonth()],
    'DD': String(d.getDate()).padStart(2, '0'),
    'HH': String(d.getHours()).padStart(2, '0'),
    'mm': String(d.getMinutes()).padStart(2, '0'),
    'ss': String(d.getSeconds()).padStart(2, '0'),
  };

  let formatted = format;
  for (const [key, value] of Object.entries(replacements)) {
    formatted = formatted.replace(key, value);
  }
  return formatted;
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Generate random ID
export const generateId = (prefix = '') => {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

// Validate email
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validate phone
export const isValidPhone = (phone) => {
  const regex = /^[0-9]{10}$/;
  return regex.test(phone.replace(/\D/g, ''));
};

// Get initial from name
export const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Download file
export const downloadFile = (data, filename, type = 'application/json') => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};

// Get color by status
export const getStatusColor = (status) => {
  const colors = {
    active: 'text-green-600 bg-green-100',
    inactive: 'text-gray-600 bg-gray-100',
    suspended: 'text-red-600 bg-red-100',
    pending: 'text-yellow-600 bg-yellow-100',
  };
  return colors[status] || colors.inactive;
};

// Get quality label
export const getQualityLabel = (score) => {
  if (score >= 85) return { label: 'Excellent', color: 'text-green-600' };
  if (score >= 70) return { label: 'Good', color: 'text-yellow-600' };
  if (score >= 50) return { label: 'Fair', color: 'text-orange-600' };
  return { label: 'Poor', color: 'text-red-600' };
};