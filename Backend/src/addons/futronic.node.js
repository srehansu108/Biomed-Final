// server/addons/futronic.node.js
const path = require('path');
const ffi = require('ffi-napi');
const ref = require('ref-napi');
const Struct = require('ref-struct-di')(ref);
const ArrayType = require('ref-array-di')(ref);

// ============================================
// FUTRONIC SDK STRUCTURES
// ============================================

// Fingerprint image structure
const FT_Image = Struct({
  'Width': 'uint32',
  'Height': 'uint32', 
  'Resolution': 'uint32',
  'ImageData': 'pointer',  // Buffer of image data
  'ImageSize': 'uint32'
});

// Fingerprint template structure
const FT_Template = Struct({
  'TemplateData': 'pointer',
  'TemplateSize': 'uint32',
  'Format': 'uint32'  // 1 = ANSI 378, 2 = ISO 19794-2
});

// Quality metrics
const FT_Quality = Struct({
  'OverallScore': 'uint32',
  'NFIQScore': 'uint32',
  'MinutiaeCount': 'uint32',
  'ImageClarity': 'uint32'
});

// Device info
const FT_DeviceInfo = Struct({
  'Manufacturer': ArrayType('char', 128),
  'Model': ArrayType('char', 128),
  'SerialNumber': ArrayType('char', 64),
  'FirmwareVersion': ArrayType('char', 32)
});

// ============================================
// FUTRONIC SDK FUNCTIONS
// ============================================

const sdkPath = process.env.SCANNER_SDK_PATH || 'C:/Program Files (x86)/Common Files/Futronic/sdk';

class FutronicSDK {
  constructor() {
    this.isInitialized = false;
    this.deviceHandle = null;
    this.deviceInfo = null;
    
    // Load the DLL
    this.dllPath = path.join(sdkPath, 'bin', 'FT_Finger.dll');
    this.ftLib = null;
  }

  initialize() {
    try {
      // Load the Futronic DLL
      this.ftLib = ffi.Library(this.dllPath, {
        // Device Management
        'FT_Init': ['bool', []],
        'FT_OpenDevice': ['bool', ['int', 'pointer']],
        'FT_CloseDevice': ['bool', ['pointer']],
        'FT_GetDeviceInfo': ['bool', ['pointer', 'pointer']],
        'FT_EnumDevices': ['uint32', ['pointer', 'uint32']],

        // Fingerprint Capture
        'FT_CaptureFinger': ['bool', ['pointer', 'pointer', 'uint32']],
        'FT_CaptureFingerWithQuality': ['bool', ['pointer', 'pointer', 'pointer', 'uint32']],
        'FT_GetFingerImage': ['bool', ['pointer', 'pointer']],
        'FT_GetFingerTemplate': ['bool', ['pointer', 'pointer']],
        
        // Template Processing
        'FT_ExtractTemplate': ['bool', ['pointer', 'pointer', 'pointer']],
        'FT_CompareTemplates': ['float', ['pointer', 'pointer']],
        'FT_CompareTemplatesWithScore': ['bool', ['pointer', 'pointer', 'pointer']],
        
        // Quality Assessment
        'FT_GetImageQuality': ['bool', ['pointer', 'pointer']],
        'FT_GetNFIQScore': ['uint32', ['pointer']],
        
        // Liveness Detection
        'FT_CheckLiveness': ['bool', ['pointer']],
        'FT_GetLivenessScore': ['float', ['pointer']],
        
        // Image Processing
        'FT_GetBitmap': ['bool', ['pointer', 'pointer', 'uint32']],
        'FT_SaveImage': ['bool', ['pointer', 'string']],
        'FT_GetImageProperties': ['bool', ['pointer', 'pointer']],
        
        // Utilities
        'FT_GetLastError': ['uint32', []],
        'FT_GetErrorString': ['string', ['uint32']],
        'FT_Version': ['string', []]
      });

      console.log('✅ Futronic SDK loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to load Futronic SDK:', error.message);
      return false;
    }
  }

  // ============================================
  // DEVICE MANAGEMENT
  // ============================================

  async enumerateDevices() {
    try {
      const countPtr = ref.alloc('uint32');
      const result = this.ftLib.FT_EnumDevices(countPtr, 0);
      
      if (result === 0) {
        const count = countPtr.deref();
        console.log(`✅ Found ${count} fingerprint device(s)`);
        return count;
      }
      return 0;
    } catch (error) {
      console.error('Enumeration failed:', error);
      return 0;
    }
  }

  async openDevice(deviceIndex = 0) {
    try {
      const handlePtr = ref.alloc('pointer');
      const result = this.ftLib.FT_OpenDevice(deviceIndex, handlePtr);
      
      if (result) {
        this.deviceHandle = handlePtr.deref();
        this.isInitialized = true;
        
        // Get device info
        const infoPtr = ref.alloc(FT_DeviceInfo);
        if (this.ftLib.FT_GetDeviceInfo(this.deviceHandle, infoPtr)) {
          this.deviceInfo = infoPtr.deref();
          console.log('✅ Device connected:', {
            manufacturer: this.deviceInfo.Manufacturer,
            model: this.deviceInfo.Model,
            serial: this.deviceInfo.SerialNumber
          });
        }
        
        return true;
      }
      
      throw new Error('Failed to open fingerprint device');
    } catch (error) {
      console.error('Device open failed:', error);
      return false;
    }
  }

  async closeDevice() {
    if (this.deviceHandle) {
      this.ftLib.FT_CloseDevice(this.deviceHandle);
      this.deviceHandle = null;
      this.isInitialized = false;
    }
  }

  // ============================================
  // FINGERPRINT CAPTURE
  // ============================================

  async captureFingerprint(timeout = 30000) {
    if (!this.isInitialized || !this.deviceHandle) {
      throw new Error('Device not initialized');
    }

    return new Promise((resolve, reject) => {
      const imagePtr = ref.alloc(FT_Image);
      const qualityPtr = ref.alloc(FT_Quality);
      
      // Capture with quality assessment
      const result = this.ftLib.FT_CaptureFingerWithQuality(
        this.deviceHandle,
        imagePtr,
        qualityPtr,
        timeout
      );

      if (!result) {
        const errorCode = this.ftLib.FT_GetLastError();
        const errorMsg = this.ftLib.FT_GetErrorString(errorCode);
        reject(new Error(`Capture failed: ${errorMsg} (Code: ${errorCode})`));
        return;
      }

      const image = imagePtr.deref();
      const quality = qualityPtr.deref();

      // Extract template
      const templatePtr = ref.alloc(FT_Template);
      if (!this.ftLib.FT_GetFingerTemplate(this.deviceHandle, templatePtr)) {
        reject(new Error('Failed to extract fingerprint template'));
        return;
      }

      const template = templatePtr.deref();
      
      // Convert image data to Buffer
      const imageData = Buffer.from(
        image.ImageData,
        image.ImageSize
      );

      // Convert template data to Buffer
      const templateData = Buffer.from(
        template.TemplateData,
        template.TemplateSize
      );

      // Check liveness
      const isLive = this.ftLib.FT_CheckLiveness(this.deviceHandle);
      const livenessScore = this.ftLib.FT_GetLivenessScore(this.deviceHandle);

      resolve({
        success: true,
        image: {
          data: imageData.toString('base64'),
          width: image.Width,
          height: image.Height,
          resolution: image.Resolution
        },
        template: {
          data: templateData.toString('base64'),
          format: template.Format === 1 ? 'ANSI_378' : 'ISO_19794_2',
          size: template.TemplateSize
        },
        quality: {
          overall: quality.OverallScore || 80,
          nfiq: quality.NFIQScore || 1,
          minutiaeCount: quality.MinutiaeCount || 50,
          imageClarity: quality.ImageClarity || 80
        },
        liveness: {
          isLive,
          score: livenessScore || 0.95
        },
        timestamp: new Date().toISOString()
      });
    });
  }

  // ============================================
  // TEMPLATE MATCHING
  // ============================================

  compareTemplates(template1, template2) {
    if (!this.isInitialized) {
      throw new Error('SDK not initialized');
    }

    try {
      // Parse template data
      const t1 = Buffer.from(template1, 'base64');
      const t2 = Buffer.from(template2, 'base64');

      const t1Ptr = ref.alloc('pointer', t1);
      const t2Ptr = ref.alloc('pointer', t2);
      
      const scorePtr = ref.alloc('float');
      const result = this.ftLib.FT_CompareTemplatesWithScore(
        t1Ptr,
        t2Ptr,
        scorePtr
      );

      if (!result) {
        throw new Error('Template comparison failed');
      }

      const score = scorePtr.deref();
      const isMatch = score >= 0.85;

      return {
        isMatch,
        score: score * 100, // Convert to percentage
        confidence: score,
        threshold: 0.85,
        details: {
          algorithm: 'Futronic SDK Matcher',
          version: this.ftLib.FT_Version()
        }
      };
    } catch (error) {
      console.error('Comparison failed:', error);
      return {
        isMatch: false,
        score: 0,
        error: error.message
      };
    }
  }

  // ============================================
  // IMAGE PROCESSING
  // ============================================

  async getLivePreview() {
    if (!this.isInitialized || !this.deviceHandle) {
      throw new Error('Device not initialized');
    }

    try {
      const imagePtr = ref.alloc(FT_Image);
      const result = this.ftLib.FT_GetFingerImage(this.deviceHandle, imagePtr);
      
      if (!result) {
        throw new Error('Failed to get live preview');
      }

      const image = imagePtr.deref();
      const imageData = Buffer.from(image.ImageData, image.ImageSize);

      return {
        imageData: imageData.toString('base64'),
        width: image.Width,
        height: image.Height,
        resolution: image.Resolution
      };
    } catch (error) {
      console.error('Live preview failed:', error);
      throw error;
    }
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  getVersion() {
    try {
      return this.ftLib.FT_Version();
    } catch {
      return 'Unknown';
    }
  }

  getLastError() {
    try {
      const code = this.ftLib.FT_GetLastError();
      return {
        code,
        message: this.ftLib.FT_GetErrorString(code)
      };
    } catch {
      return { code: -1, message: 'Unknown error' };
    }
  }
}

module.exports = new FutronicSDK();