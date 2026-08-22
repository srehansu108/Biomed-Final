const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class KeyManagement {
  constructor() {
    this.keyPath = process.env.ENCRYPTION_KEY_PATH || path.join(__dirname, '../../keys/biometric.key');
    this.key = null;
    this.algorithm = 'aes-256-gcm';
    
    // Ensure keys directory exists
    const keyDir = path.dirname(this.keyPath);
    if (!fs.existsSync(keyDir)) {
      fs.mkdirSync(keyDir, { recursive: true });
    }
    
    this.loadOrGenerateKey();
  }

  loadOrGenerateKey() {
    try {
      if (fs.existsSync(this.keyPath)) {
        this.key = fs.readFileSync(this.keyPath);
        console.log('✅ Encryption key loaded from file');
      } else {
        this.key = crypto.randomBytes(32);
        fs.writeFileSync(this.keyPath, this.key, { mode: 0o600 });
        console.log('🔑 New encryption key generated');
      }
      
      // Validate key length
      if (this.key.length !== 32) {
        throw new Error('Invalid encryption key length');
      }
    } catch (error) {
      console.error('❌ Key management error:', error);
      throw new Error('Failed to initialize encryption');
    }
  }

  getKey() {
    return this.key;
  }

  rotateKey() {
    const newKey = crypto.randomBytes(32);
    const backupPath = `${this.keyPath}.backup`;
    
    if (fs.existsSync(this.keyPath)) {
      fs.copyFileSync(this.keyPath, backupPath);
    }
    
    fs.writeFileSync(this.keyPath, newKey, { mode: 0o600 });
    this.key = newKey;
    
    console.log('🔄 Encryption key rotated');
    return newKey;
  }

  encrypt(data, aad = null) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    if (aad) {
      cipher.setAAD(Buffer.from(aad));
    }
    
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      aad: aad || null
    };
  }

  decrypt(encrypted, ivBase64, authTagBase64, aad = null) {
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    
    if (aad) {
      decipher.setAAD(Buffer.from(aad));
    }
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  hash(data) {
    return crypto.createHash('sha256')
      .update(data + process.env.ENCRYPTION_SALT || 'biomed-salt')
      .digest('hex');
  }

  verify(data, hash) {
    return this.hash(data) === hash;
  }
}

module.exports = new KeyManagement();