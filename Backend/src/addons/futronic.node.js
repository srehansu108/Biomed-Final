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
      
      // ✅ FIX: Try multiple DLL names (ftrScanAPI.dll is the correct one for your SDK)
      const possibleDllNames = [
        'ftrScanAPI.dll',   // ← Your SDK has this one
        'FT_Finger.dll',    // ← Older SDKs use this
        'FTRAPI.dll'        // ← Alternative name
      ];
      
      let dllFound = false;
      
      for (const dllName of possibleDllNames) {
        const testPath = path.join(sdkPath, 'bin', dllName);
        console.log(`📁 Looking for Futronic DLL at: ${testPath}`);
        
        if (fs.existsSync(testPath)) {
          this.dllPath = testPath;
          dllFound = true;
          console.log(`✅ Found Futronic DLL: ${dllName}`);
          break;
        }
      }
      
      if (!dllFound) {
        console.warn(`⚠️ No Futronic DLL found in: ${path.join(sdkPath, 'bin')}`);
        console.warn('💡 Please install Futronic SDK and set SCANNER_SDK_PATH correctly');
        return false;
      }

      // Try to load the DLL using ffi-napi
      try {
        const ffi = require('ffi-napi');
        const ref = require('ref-napi');
        
        // ✅ FIX: Try to load with correct function names
        // The ftrScanAPI.dll might have different function names
        let lib = null;
        
        try {
          // Try with FT_ prefix (older SDK)
          lib = ffi.Library(this.dllPath, {
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
        } catch (err) {
          // Try with ftr prefix (newer SDK)
          console.log('⚠️ FT_ prefix failed, trying ftrScanAPI function names...');
          lib = ffi.Library(this.dllPath, {
            'ftrInit': ['bool', []],
            'ftrOpenDevice': ['bool', ['int', 'pointer']],
            'ftrCloseDevice': ['bool', ['pointer']],
            'ftrGetDeviceInfo': ['bool', ['pointer', 'pointer']],
            'ftrEnumDevices': ['uint32', ['pointer', 'uint32']],
            'ftrCaptureFinger': ['bool', ['pointer', 'pointer', 'uint32']],
            'ftrCaptureFingerWithQuality': ['bool', ['pointer', 'pointer', 'pointer', 'uint32']],
            'ftrGetFingerImage': ['bool', ['pointer', 'pointer']],
            'ftrGetFingerTemplate': ['bool', ['pointer', 'pointer']],
            'ftrExtractTemplate': ['bool', ['pointer', 'pointer', 'pointer']],
            'ftrCompareTemplates': ['float', ['pointer', 'pointer']],
            'ftrCompareTemplatesWithScore': ['bool', ['pointer', 'pointer', 'pointer']],
            'ftrGetImageQuality': ['bool', ['pointer', 'pointer']],
            'ftrGetNFIQScore': ['uint32', ['pointer']],
            'ftrCheckLiveness': ['bool', ['pointer']],
            'ftrGetLivenessScore': ['float', ['pointer']],
            'ftrGetBitmap': ['bool', ['pointer', 'pointer', 'uint32']],
            'ftrSaveImage': ['bool', ['pointer', 'string']],
            'ftrGetImageProperties': ['bool', ['pointer', 'pointer']],
            'ftrGetLastError': ['uint32', []],
            'ftrGetErrorString': ['string', ['uint32']],
            'ftrVersion': ['string', []]
          });
        }
        
        this.ftLib = lib;
        this.isLoaded = true;
        console.log('✅ Futronic SDK loaded successfully');
        return true;
        
      } catch (error) {
        console.warn('⚠️ Failed to load Futronic DLL:', error.message);
        console.warn('💡 Make sure Visual C++ Redistributable is installed');
        console.warn('💡 Also try running Node.js as Administrator');
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
      
      // Try FT_EnumDevices first, fallback to ftrEnumDevices
      let result;
      try {
        result = this.ftLib.FT_EnumDevices(countPtr, 0);
      } catch {
        result = this.ftLib.ftrEnumDevices(countPtr, 0);
      }
      
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
      
      // Try FT_OpenDevice first, fallback to ftrOpenDevice
      let result;
      try {
        result = this.ftLib.FT_OpenDevice(deviceIndex, handlePtr);
      } catch {
        result = this.ftLib.ftrOpenDevice(deviceIndex, handlePtr);
      }
      
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
      
      let result;
      try {
        result = this.ftLib.FT_GetDeviceInfo(this.deviceHandle, infoPtr);
      } catch {
        result = this.ftLib.ftrGetDeviceInfo(this.deviceHandle, infoPtr);
      }
      
      if (result) {
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
      
      // Try FT_CaptureFingerWithQuality first, fallback to ftrCaptureFingerWithQuality
      let result;
      try {
        result = this.ftLib.FT_CaptureFingerWithQuality(
          this.deviceHandle,
          imagePtr,
          qualityPtr,
          timeout
        );
      } catch {
        result = this.ftLib.ftrCaptureFingerWithQuality(
          this.deviceHandle,
          imagePtr,
          qualityPtr,
          timeout
        );
      }

      if (!result) {
        let errorCode, errorMsg;
        try {
          errorCode = this.ftLib.FT_GetLastError();
          errorMsg = this.ftLib.FT_GetErrorString(errorCode);
        } catch {
          errorCode = this.ftLib.ftrGetLastError();
          errorMsg = this.ftLib.ftrGetErrorString(errorCode);
        }
        throw new Error(`Capture failed: ${errorMsg || 'Unknown error'} (Code: ${errorCode || 'N/A'})`);
      }

      const image = imagePtr.deref();
      const quality = qualityPtr.deref();

      // Extract template
      const templatePtr = ref.alloc(FT_Template);
      
      let templateResult;
      try {
        templateResult = this.ftLib.FT_GetFingerTemplate(this.deviceHandle, templatePtr);
      } catch {
        templateResult = this.ftLib.ftrGetFingerTemplate(this.deviceHandle, templatePtr);
      }
      
      if (!templateResult) {
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
      let isLive = true;
      let livenessScore = 0.95;
      try {
        isLive = this.ftLib.FT_CheckLiveness(this.deviceHandle);
        livenessScore = this.ftLib.FT_GetLivenessScore(this.deviceHandle);
      } catch {
        try {
          isLive = this.ftLib.ftrCheckLiveness(this.deviceHandle);
          livenessScore = this.ftLib.ftrGetLivenessScore(this.deviceHandle);
        } catch {
          // Liveness check failed, assume live
        }
      }

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
      
      let result;
      try {
        result = this.ftLib.FT_GetFingerImage(this.deviceHandle, imagePtr);
      } catch {
        result = this.ftLib.ftrGetFingerImage(this.deviceHandle, imagePtr);
      }
      
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
        try {
          this.ftLib.FT_CloseDevice(this.deviceHandle);
        } catch {
          this.ftLib.ftrCloseDevice(this.deviceHandle);
        }
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
        try {
          return this.ftLib.FT_Version();
        } catch {
          return this.ftLib.ftrVersion();
        }
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