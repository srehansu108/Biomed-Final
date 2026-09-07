// server/services/biometricService.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const EncryptionService = require('./encryptionService');
const { FINGER_TYPES, QUALITY_THRESHOLDS, SCANNER } = require('../config/biometric');

// ✅ Load Futronic SDK if available
let FutronicSDK = null;
try {
  FutronicSDK = require('../addons/futronic.node');
  console.log('✅ Futronic SDK loaded successfully');
} catch (error) {
  console.warn('⚠️ Futronic SDK not available, using simulated mode:', error.message);
}

class BiometricService {
  constructor() {
    this.isReady = false;
    this.scannerType = null;
    this.sdkVersion = null;
    this.tempDir = path.join(__dirname, '../../temp/fingerprints');
    this.scannerStatus = 'offline';
    this.initialized = false;
    this.isSimulated = true;
    this.futronicSDK = null;
    this.captureSource = 'simulated';
    this.deviceInfo = null;
    
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    
    // Initialize scanner
    this.initialize();
  }

  async initialize() {
    console.log('🔍 Initializing Biometric Service...');
    console.log('📡 Current Environment: NODE_ENV =', process.env.NODE_ENV);
    console.log('📡 Scanner Enabled:', process.env.SCANNER_ENABLED);
    console.log('📡 SDK Path:', process.env.SCANNER_SDK_PATH);
    
    try {
      // ✅ Check for physical scanner
      const hasPhysicalScanner = await this.detectPhysicalScanner();
      console.log(`🔍 Physical scanner detection result: ${hasPhysicalScanner}`);
      
      if (hasPhysicalScanner && process.env.SCANNER_ENABLED !== 'false') {
        console.log('✅ Physical scanner detected');
        
        // ✅ Try to initialize Futronic SDK
        try {
          if (FutronicSDK) {
            console.log('🔧 Initializing Futronic SDK...');
            const initResult = await FutronicSDK.initialize();
            console.log(`🔧 SDK initialization result: ${initResult}`);
            
            if (initResult) {
              console.log('🔍 Enumerating devices...');
              const devices = await FutronicSDK.enumerateDevices();
              console.log(`🔍 Found ${devices} device(s)`);
              
              if (devices > 0) {
                console.log('🔌 Opening device...');
                const opened = await FutronicSDK.openDevice(0);
                console.log(`🔌 Device open result: ${opened}`);
                
                if (opened) {
                  this.scannerType = 'futronic';
                  this.scannerStatus = 'online';
                  this.isSimulated = false;
                  this.futronicSDK = FutronicSDK;
                  this.sdkVersion = FutronicSDK.getVersion();
                  this.captureSource = 'real_device';
                  
                  // Get device info
                  try {
                    const deviceInfo = await FutronicSDK.getDeviceInfo();
                    this.deviceInfo = deviceInfo;
                    console.log('✅ Futronic scanner initialized and ready');
                    console.log(`📱 Device: ${deviceInfo.Manufacturer} ${deviceInfo.Model}`);
                    console.log(`🔢 Serial: ${deviceInfo.SerialNumber}`);
                    console.log(`📡 SDK Version: ${this.sdkVersion}`);
                  } catch (error) {
                    console.warn('⚠️ Could not get device info:', error.message);
                  }
                } else {
                  console.warn('⚠️ Failed to open Futronic device, falling back to simulated');
                  this.isSimulated = true;
                  this.captureSource = 'simulated';
                }
              } else {
                console.warn('⚠️ No Futronic devices found, falling back to simulated');
                this.isSimulated = true;
                this.captureSource = 'simulated';
              }
            } else {
              console.warn('⚠️ Futronic SDK initialization failed, falling back to simulated');
              this.isSimulated = true;
              this.captureSource = 'simulated';
            }
          } else {
            console.warn('⚠️ Futronic SDK not loaded, falling back to simulated');
            this.isSimulated = true;
            this.captureSource = 'simulated';
          }
        } catch (error) {
          console.error('❌ Futronic SDK error:', error.message);
          console.error('❌ Stack trace:', error.stack);
          this.isSimulated = true;
          this.captureSource = 'simulated';
        }
      } else {
        console.log('⚠️ No physical scanner detected - using simulated mode');
        if (!hasPhysicalScanner) {
          console.log('💡 Reasons: No USB device found or scanner not connected');
        }
        if (process.env.SCANNER_ENABLED === 'false') {
          console.log('💡 Scanner disabled via environment variable');
        }
        this.isSimulated = true;
        this.captureSource = 'simulated';
      }
      
      this.isReady = true;
      this.initialized = true;
      
      if (!this.isSimulated) {
        console.log(`✅ Biometric service ready with ${this.scannerType} (${this.sdkVersion})`);
        console.log(`✅ CAPTURE SOURCE: REAL DEVICE`);
      } else {
        console.log('✅ Biometric service ready in SIMULATED mode');
        console.log(`✅ CAPTURE SOURCE: SIMULATED (${this.captureSource})`);
      }
      return true;
      
    } catch (error) {
      console.error('❌ Biometric initialization failed:', error.message);
      console.error('❌ Stack trace:', error.stack);
      // Always fallback to simulated
      this.scannerType = 'simulated';
      this.scannerStatus = 'simulated';
      this.isReady = true;
      this.isSimulated = true;
      this.captureSource = 'simulated';
      this.sdkVersion = 'simulated-1.0.0';
      console.log('⚠️ Falling back to simulated mode');
      return true;
    }
  }

  async detectPhysicalScanner() {
    try {
      // Simple USB device detection using PowerShell (Windows)
      const { exec } = require('child_process');
      return new Promise((resolve) => {
        // Check for Futronic specifically
        const commands = [
          'powershell -Command "Get-PnpDevice -PresentOnly | Where-Object { $_.FriendlyName -match \'fingerprint|finger|biometric|Futronic\' } | Measure-Object | Select-Object -ExpandProperty Count"',
          'powershell -Command "Get-PnpDevice -PresentOnly | Where-Object { $_.FriendlyName -match \'Futronic\' } | Measure-Object | Select-Object -ExpandProperty Count"'
        ];
        
        let executed = 0;
        let found = false;
        
        commands.forEach(cmd => {
          exec(cmd, (error, stdout) => {
            executed++;
            if (!error && !found) {
              const count = parseInt(stdout.trim()) || 0;
              if (count > 0) {
                found = true;
                resolve(true);
              }
            }
            if (executed === commands.length && !found) {
              // Also check if SCANNER_SDK_PATH exists
              const sdkPath = process.env.SCANNER_SDK_PATH;
              if (sdkPath && fs.existsSync(sdkPath)) {
                console.log('📁 SDK path exists, but no device found');
              }
              resolve(false);
            }
          });
        });
        
        // Timeout fallback
        setTimeout(() => {
          if (!found) resolve(false);
        }, 3000);
      });
    } catch (error) {
      console.error('Device detection error:', error);
      return false;
    }
  }

  getScannerStatus() {
    return {
      isReady: this.isReady,
      scannerType: this.scannerType,
      sdkVersion: this.sdkVersion,
      status: this.scannerStatus,
      isSimulated: this.isSimulated,
      isFutronic: !this.isSimulated,
      initialized: this.initialized,
      captureSource: this.captureSource,
      deviceInfo: this.deviceInfo || {
        Manufacturer: this.isSimulated ? 'Simulated Scanner' : 'Futronic',
        Model: this.isSimulated ? 'Simulated Model' : 'FS80',
        SerialNumber: this.isSimulated ? 'SIM-001' : 'Unknown',
        FirmwareVersion: this.sdkVersion || '1.0.0'
      }
    };
  }

  async captureFingerprint(fingerType = 'right_thumb', onProgress, timeout = SCANNER.TIMEOUT || 30000) {
    try {
      if (!this.isReady) {
        await this.initialize();
      }

      // Validate finger type
      if (!Object.values(FINGER_TYPES).includes(fingerType)) {
        throw new Error(`Invalid finger type: ${fingerType}`);
      }

      // Start capture progress
      onProgress?.({ status: 'initializing', progress: 5, message: 'Initializing scanner...' });

      // ✅ CHECK: Use real scanner if available
      if (!this.isSimulated && this.futronicSDK) {
        console.log(`🔴 USING REAL SCANNER for ${fingerType}`);
        console.log(`📱 Device: ${this.deviceInfo?.Manufacturer} ${this.deviceInfo?.Model}`);
        
        try {
          onProgress?.({ status: 'scanning', progress: 20, message: 'Please place your finger on the scanner...' });
          
          // ✅ Capture from real device
          const result = await this.futronicSDK.captureFingerprint(timeout);
          
          onProgress?.({ status: 'processing', progress: 70, message: 'Processing fingerprint...' });
          
          if (!result.success) {
            throw new Error(result.error || 'Real scanner capture failed');
          }

          // Validate quality
          const qualityThreshold = parseInt(process.env.SCANNER_QUALITY_THRESHOLD) || 70;
          if (result.quality.overall < qualityThreshold) {
            throw new Error(`Poor quality fingerprint (${result.quality.overall}%). Please clean finger and try again.`);
          }

          console.log(`✅ Real fingerprint captured: Quality ${result.quality.overall}%, ${result.quality.minutiaeCount || 0} minutiae`);
          console.log(`🔍 Capture source: REAL DEVICE`);

          return {
            success: true,
            fingerType,
            template: result.template.data, // Already base64
            quality: result.quality.overall,
            metrics: {
              imageClarity: result.quality.imageClarity || result.quality.overall,
              minutiaePoints: result.quality.minutiaeCount || 0,
              livenessCheck: result.liveness.isLive || false,
              overallQuality: result.quality.overall,
              nfiq: result.quality.nfiq || 1
            },
            imageData: result.image.data || null,
            minutiae: [],
            liveness: result.liveness || { isLive: true, score: 0.95 },
            deviceInfo: {
              manufacturer: 'Futronic',
              model: this.deviceInfo?.Model || 'FS80',
              sdkVersion: this.sdkVersion
            },
            timestamp: new Date().toISOString(),
            source: 'real_device',
            sourceLabel: '🟢 REAL SCANNER'
          };

        } catch (error) {
          console.error('❌ Real scanner capture failed:', error.message);
          console.log('⚠️ Falling back to simulated capture...');
          // ✅ Fallback to simulated if real device fails
          return this.simulateCapture(fingerType, onProgress, 'fallback_after_real_failure');
        }
      }

      // ✅ Fallback to simulated
      console.log('🟡 Using SIMULATED fingerprint capture');
      console.log(`📌 Source: ${this.captureSource}`);
      return this.simulateCapture(fingerType, onProgress, 'simulated');

    } catch (error) {
      console.error('❌ Fingerprint capture failed:', error);
      return {
        success: false,
        error: error.message,
        source: 'error'
      };
    }
  }

  async simulateCapture(fingerType, onProgress, source = 'simulated') {
    console.log(`🟡 Simulating fingerprint capture (source: ${source})`);
    
    const steps = [
      { status: 'initializing', progress: 10, message: 'Initializing scanner...' },
      { status: 'scanning', progress: 25, message: 'Waiting for finger...' },
      { status: 'scanning', progress: 40, message: 'Finger detected, capturing...' },
      { status: 'processing', progress: 60, message: 'Processing fingerprint...' },
      { status: 'processing', progress: 75, message: 'Extracting minutiae...' },
      { status: 'processing', progress: 90, message: 'Analyzing quality...' },
      { status: 'completed', progress: 100, message: 'Capture complete!' }
    ];

    for (const step of steps) {
      onProgress?.(step);
      await this.sleep(600);
    }

    const quality = 80 + Math.floor(Math.random() * 15);
    const minutiaeCount = 50 + Math.floor(Math.random() * 50);
    
    const minutiae = [];
    for (let i = 0; i < minutiaeCount; i++) {
      minutiae.push({
        x: 50 + Math.random() * 300,
        y: 50 + Math.random() * 300,
        angle: Math.random() * Math.PI * 2,
        type: Math.random() > 0.6 ? 'ridge_ending' : 'bifurcation',
        quality: 60 + Math.random() * 40
      });
    }

    const template = JSON.stringify({
      format: 'ISO_19794_2',
      version: '1.0',
      minutiae: minutiae,
      fingerType,
      imageQuality: quality,
      capturedAt: new Date().toISOString(),
      source: source
    });

    return {
      template,
      quality,
      minutiae,
      imageData: Buffer.from(template).toString('base64'),
      metrics: {
        imageClarity: quality,
        minutiaePoints: minutiaeCount,
        livenessCheck: true,
        overallQuality: quality,
        nfiq: 1
      },
      liveness: {
        isLive: true,
        score: 0.95
      },
      source: source,
      sourceLabel: source === 'real_device' ? '🟢 REAL SCANNER' : '🟡 SIMULATED'
    };
  }

  // ✅ Add method to get device info
  async getDeviceInfo() {
    if (!this.isSimulated && this.futronicSDK) {
      try {
        return await this.futronicSDK.getDeviceInfo();
      } catch (error) {
        console.error('Failed to get device info:', error);
        return null;
      }
    }
    return null;
  }

  async cleanup() {
    if (this.futronicSDK) {
      try {
        await this.futronicSDK.closeDevice();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
    this.isReady = false;
    this.initialized = false;
    console.log('✅ Biometric service cleaned up');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================
  // VERIFICATION FUNCTIONS
  // ============================================
  
  async verifyFingerprint(providedTemplate, storedFingerprint, userId) {
    try {
      // Decrypt stored template
      const decrypted = EncryptionService.decrypt(
        storedFingerprint.templateEncrypted,
        storedFingerprint.templateIv,
        storedFingerprint.templateAuthTag,
        userId
      );

      // Parse templates
      const t1 = this.parseTemplate(providedTemplate);
      const t2 = this.parseTemplate(decrypted);

      // Match minutiae
      const matchResult = this.matchFingerprints(t1, t2);
      const confidence = this.calculateConfidence(matchResult);

      return {
        success: true,
        isMatch: confidence >= 0.85,
        matchScore: confidence * 100,
        matchedMinutiae: matchResult.matched,
        totalMinutiae: matchResult.total,
        confidence: confidence,
        details: {
          algorithm: 'ISO_19794_2_MATCHER',
          threshold: 0.85,
          matchedPoints: matchResult.matched,
          totalPoints: matchResult.total
        }
      };
    } catch (error) {
      console.error('Fingerprint verification failed:', error);
      return {
        success: false,
        error: error.message || 'Verification failed'
      };
    }
  }

  matchFingerprints(template1, template2) {
    if (!template1 || !template2) {
      return { matched: 0, total: 0 };
    }

    const minutiae1 = template1.minutiae || [];
    const minutiae2 = template2.minutiae || [];
    const total = Math.max(minutiae1.length, minutiae2.length);
    
    if (total === 0) {
      return { matched: 0, total: 0 };
    }

    let matches = 0;
    const matched = new Set();
    const threshold = 8;

    for (const m1 of minutiae1) {
      for (let i = 0; i < minutiae2.length; i++) {
        if (matched.has(i)) continue;
        
        const m2 = minutiae2[i];
        const dx = m1.x - m2.x;
        const dy = m1.y - m2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < threshold) {
          matches++;
          matched.add(i);
          break;
        }
      }
    }

    return { matched: matches, total };
  }

  calculateConfidence(matchResult) {
    if (matchResult.total === 0) return 0;
    
    const ratio = matchResult.matched / matchResult.total;
    
    if (ratio < 0.2) return 0;
    if (ratio < 0.4) return 0.2 + ratio * 0.5;
    if (ratio < 0.6) return 0.4 + ratio * 0.8;
    if (ratio < 0.8) return 0.7 + ratio * 0.3;
    return Math.min(1, ratio);
  }

  parseTemplate(template) {
    try {
      if (typeof template === 'string') {
        try {
          return JSON.parse(template);
        } catch {
          try {
            const decoded = Buffer.from(template, 'base64').toString();
            return JSON.parse(decoded);
          } catch {
            return { minutiae: [] };
          }
        }
      }
      return template || { minutiae: [] };
    } catch {
      return { minutiae: [] };
    }
  }

  async getLivePreview() {
    if (!this.isSimulated && this.futronicSDK) {
      try {
        const preview = await this.futronicSDK.getLivePreview();
        return preview;
      } catch (error) {
        console.error('Live preview error:', error);
        return {
          imageData: Buffer.from('simulated_preview').toString('base64'),
          width: 400,
          height: 400,
          resolution: 500
        };
      }
    }
    return {
      imageData: Buffer.from('simulated_preview').toString('base64'),
      width: 400,
      height: 400,
      resolution: 500
    };
  }
}

module.exports = new BiometricService();