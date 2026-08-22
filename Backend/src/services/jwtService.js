const jwt = require('jsonwebtoken');

class JWTService {
  constructor() {
    this.secret = process.env.JWT_SECRET;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET;
    this.expiresIn = process.env.JWT_EXPIRE || '24h';
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRE || '7d';

    if (!this.secret || !this.refreshSecret) {
      throw new Error('JWT secrets are required. Please check your .env file.');
    }
  }

  generateToken(payload) {
    try {
      return jwt.sign(payload, this.secret, { 
        expiresIn: this.expiresIn,
        issuer: 'biochemical',
        audience: 'biochemical-users'
      });
    } catch (error) {
      throw new Error(`Failed to generate token: ${error.message}`);
    }
  }

  generateRefreshToken(payload) {
    try {
      return jwt.sign(payload, this.refreshSecret, { 
        expiresIn: this.refreshExpiresIn,
        issuer: 'biochemical',
        audience: 'biochemical-users'
      });
    } catch (error) {
      throw new Error(`Failed to generate refresh token: ${error.message}`);
    }
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.secret, {
        issuer: 'biochemical',
        audience: 'biochemical-users'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      }
      throw new Error('Invalid token');
    }
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshSecret, {
        issuer: 'biochemical',
        audience: 'biochemical-users'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      }
      throw new Error('Invalid refresh token');
    }
  }

  decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }

  generateTokenPair(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isVerified: user.isVerified
    };

    const accessToken = this.generateToken(payload);
    const refreshToken = this.generateRefreshToken({ userId: user._id });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.expiresIn,
      tokenType: 'Bearer',
      issuedAt: Math.floor(Date.now() / 1000)
    };
  }

  // Rotate tokens
  refreshTokens(refreshToken) {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);
      
      // Generate new tokens
      const newAccessToken = this.generateToken({
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      });

      const newRefreshToken = this.generateRefreshToken({
        userId: decoded.userId
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: this.expiresIn
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Check if token needs refresh (expires in less than 5 minutes)
  needsRefresh(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return true;
      
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = decoded.exp - now;
      
      return timeLeft < 300; // 5 minutes
    } catch {
      return true;
    }
  }

  // Extract token from Authorization header
  extractTokenFromHeader(authHeader) {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    
    return parts[1];
  }
}

module.exports = new JWTService();