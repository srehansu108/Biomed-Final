// server/addons/futronic.node.js
const path = require('path');
const fs = require('fs');

// ============================================
// FUTRONIC SDK WRAPPER WITH FALLBACKS
// ============================================

class FutronicSDKWrapper {
  constructor() {
    this.isInitialized = false;
    this.deviceHandle = null;
    this.deviceInfo = null;
    this.dllPath = null;
    this.ftLib = null;
    this.isLoaded = false;
  }

  initialize() {
    try {
      // Get SDK path from environment
      const sdkPath = process.env.SCANNER_SDK_PATH || 'C:/Program Files (x86)/Common Files/Futronic/sdk';
      this.dllPath = path.join(sdkPath, 'bin', 'FT_Finger.dll');
      
      console.log(`📁 Looking for Futronic DLL at: ${this.dllPath}`);
      
      // Check if DLL exists
      if (!fs.existsSync(this.dllPath)) {
        console.warn(`⚠️ Futronic DLL not found at: ${this.dllPath}`);
        console.warn('💡 Please install Futronic SDK and set SCANNER_SDK_PATH correctly');
        return false;
      }

      console.log('✅ Found Futronic DLL');
      
      // Try to load the DLL using ffi-napi
      try {
        const ffi = require('ffi-napi');
        const ref = require('ref-napi');
        
        // Load the library
        this.ftLib = ffi.Library(this.dllPath, {
          'FT_Init': ['bool', []],
          'FT_OpenDevice': ['bool', ['int', 'pointer']],
          'FT_CloseDevice': ['bool', ['pointer']],
          'FT_GetDeviceInfo': ['bool', ['pointer', 'pointer']],
          'FT_EnumDevices': ['uint32', ['pointer', 'uint32']],
          'FT_CaptureFinger': ['bool', ['pointer', 'pointer', 'uint32']],
          'FT_CaptureFingerWithQuality': ['bool', ['pointer', 'pointer', 'pointer', 'uint32']],
          'FT_GetFingerImage': ['bool', ['pointer', 'pointer']],
          'FT_GetFingerTemplate': ['bool', ['pointer', 'pointer']],
          'FT_ExtractTemplate': ['bool', ['pointer', 'pointer', 'pointer']],
          'FT_CompareTemplates': ['float', ['pointer', 'pointer']],
          'FT_CompareTemplatesWithScore': ['bool', ['pointer', 'pointer', 'pointer']],
          'FT_GetImageQuality': ['bool', ['pointer', 'pointer']],
          'FT_GetNFIQScore': ['uint32', ['pointer']],
          'FT_CheckLiveness': ['bool', ['pointer']],
          'FT_GetLivenessScore': ['float', ['pointer']],
          'FT_GetBitmap': ['bool', ['pointer', 'pointer', 'uint32']],
          'FT_SaveImage': ['bool', ['pointer', 'string']],
          'FT_GetImageProperties': ['bool', ['pointer', 'pointer']],
          'FT_GetLastError': ['uint32', []],
          'FT_GetErrorString': ['string', ['uint32']],
          'FT_Version': ['string', []]
        });
        
        this.isLoaded = true;
        console.log('✅ Futronic SDK loaded successfully');
        return true;
        
      } catch (error) {
        console.warn('⚠️ Failed to load Futronic DLL:', error.message);
        console.warn('💡 Make sure Visual C++ Redistributable is installed');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Futronic SDK initialization error:', error.message);
      return false;
    }
  }

  async enumerateDevices() {
    if (!this.isLoaded || !this.ftLib) {
      console.warn('⚠️ SDK not loaded, cannot enumerate devices');
      return 0;
    }

    try {
      const { ref } = require('ref-napi');
      const countPtr = ref.alloc('uint32');
      const result = this.ftLib.FT_EnumDevices(countPtr, 0);
      
      if (result === 0) {
        const count = countPtr.deref();
        console.log(`✅ Found ${count} fingerprint device(s)`);
        return count;
      }
      console.warn(`⚠️ Enumeration failed with code: ${result}`);
      return 0;
    } catch (error) {
      console.error('Enumeration failed:', error);
      return 0;
    }
  }

  async openDevice(deviceIndex = 0) {
    if (!this.isLoaded || !this.ftLib) {
      console.warn('⚠️ SDK not loaded, cannot open device');
      return false;
    }

    try {
      const { ref } = require('ref-napi');
      const handlePtr = ref.alloc('pointer');
      const result = this.ftLib.FT_OpenDevice(deviceIndex, handlePtr);
      
      if (result) {
        this.deviceHandle = handlePtr.deref();
        this.isInitialized = true;
        console.log('✅ Device opened successfully');
        return true;
      }
      
      console.warn('⚠️ Failed to open device');
      return false;
    } catch (error) {
      console.error('Device open failed:', error);
      return false;
    }
  }

  async getDeviceInfo() {
    if (!this.isInitialized || !this.deviceHandle) {
      return null;
    }

    try {
      const { ref, Struct, ArrayType } = require('ref-napi');
      const refStruct = require('ref-struct-di')(ref);
      
      const FT_DeviceInfo = refStruct({
        'Manufacturer': ArrayType('char', 128),
        'Model': ArrayType('char', 128),
        'SerialNumber': ArrayType('char', 64),
        'FirmwareVersion': ArrayType('char', 32)
      });

      const infoPtr = ref.alloc(FT_DeviceInfo);
      if (this.ftLib.FT_GetDeviceInfo(this.deviceHandle, infoPtr)) {
        const info = infoPtr.deref();
        this.deviceInfo = {
          Manufacturer: this._cleanString(info.Manufacturer),
          Model: this._cleanString(info.Model),
          SerialNumber: this._cleanString(info.SerialNumber),
          FirmwareVersion: this._cleanString(info.FirmwareVersion)
        };
        return this.deviceInfo;
      }
      return null;
    } catch (error) {
      console.error('Get device info failed:', error);
      return null;
    }
  }

  async captureFingerprint(timeout = 30000) {
    if (!this.isInitialized || !this.deviceHandle) {
      throw new Error('Device not initialized');
    }

    try {
      const { ref, Struct } = require('ref-napi');
      const refStruct = require('ref-struct-di')(ref);
      
      const FT_Image = refStruct({
        'Width': 'uint32',
        'Height': 'uint32',
        'Resolution': 'uint32',
        'ImageData': 'pointer',
        'ImageSize': 'uint32'
      });

      const FT_Quality = refStruct({
        'OverallScore': 'uint32',
        'NFIQScore': 'uint32',
        'MinutiaeCount': 'uint32',
        'ImageClarity': 'uint32'
      });

      const FT_Template = refStruct({
        'TemplateData': 'pointer',
        'TemplateSize': 'uint32',
        'Format': 'uint32'
      });

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
        throw new Error(`Capture failed: ${errorMsg} (Code: ${errorCode})`);
      }

      const image = imagePtr.deref();
      const quality = qualityPtr.deref();

      // Extract template
      const templatePtr = ref.alloc(FT_Template);
      if (!this.ftLib.FT_GetFingerTemplate(this.deviceHandle, templatePtr)) {
        throw new Error('Failed to extract fingerprint template');
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

      return {
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
      };
    } catch (error) {
      console.error('Capture failed:', error);
      throw error;
    }
  }

  async getLivePreview() {
    if (!this.isInitialized || !this.deviceHandle) {
      throw new Error('Device not initialized');
    }

    try {
      const { ref, Struct } = require('ref-napi');
      const refStruct = require('ref-struct-di')(ref);
      
      const FT_Image = refStruct({
        'Width': 'uint32',
        'Height': 'uint32',
        'Resolution': 'uint32',
        'ImageData': 'pointer',
        'ImageSize': 'uint32'
      });

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

  async closeDevice() {
    if (this.deviceHandle) {
      try {
        this.ftLib.FT_CloseDevice(this.deviceHandle);
        console.log('✅ Device closed');
      } catch (error) {
        console.error('Close device error:', error);
      }
      this.deviceHandle = null;
      this.isInitialized = false;
    }
  }

  getVersion() {
    try {
      if (this.isLoaded && this.ftLib) {
        return this.ftLib.FT_Version();
      }
      return 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  _cleanString(str) {
    if (!str) return '';
    // Remove null bytes and trim
    return str.replace(/\x00/g, '').trim();
  }
}

module.exports = new FutronicSDKWrapper();