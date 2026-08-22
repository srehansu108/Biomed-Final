const KeyManagement = require('../config/encryption');

class EncryptionService {
  constructor() {
    this.keyManagement = KeyManagement;
  }

  encrypt(data, userId) {
    try {
      // Add user-specific salt
      const saltedData = data + userId;
      
      // Generate hash for verification
      const hash = this.keyManagement.hash(saltedData);
      
      // Encrypt with AAD (user ID as associated data)
      const result = this.keyManagement.encrypt(saltedData, userId);
      
      return {
        encrypted: result.encrypted,
        iv: result.iv,
        authTag: result.authTag,
        hash: hash
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  decrypt(encrypted, iv, authTag, userId) {
    try {
      // Decrypt with AAD
      const decrypted = this.keyManagement.decrypt(encrypted, iv, authTag, userId);
      
      // Verify the data hasn't been tampered with
      // We can't verify the hash here because we don't have the original data
      // But we can verify the structure
      
      if (!decrypted || decrypted.length < 10) {
        throw new Error('Decrypted data is invalid');
      }
      
      // Remove the userId salt if present
      // Since we added the userId at encryption time, we need to remove it
      // But we should verify it matches first
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  hash(data) {
    return this.keyManagement.hash(data);
  }

  verify(data, hash) {
    return this.keyManagement.verify(data, hash);
  }

  // Generate a secure random token
  generateToken(length = 32) {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate a secure random code (for OTP)
  generateOTP(length = 6) {
    const crypto = require('crypto');
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(crypto.randomBytes(1)[0] / 25.6)];
    }
    return otp;
  }
}

module.exports = new EncryptionService();