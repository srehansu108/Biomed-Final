const zlib = require('zlib');

class TemplateCompressor {
  static compress(template) {
    try {
      const buffer = Buffer.isBuffer(template) ? template : Buffer.from(template);
      const compressed = zlib.gzipSync(buffer, { level: 9 });
      return compressed.toString('base64');
    } catch (error) {
      console.error('Compression error:', error);
      return template.toString('base64');
    }
  }

  static decompress(compressed) {
    try {
      const buffer = Buffer.from(compressed, 'base64');
      const decompressed = zlib.gunzipSync(buffer);
      return decompressed.toString('utf8');
    } catch (error) {
      console.error('Decompression error:', error);
      return compressed;
    }
  }

  static getCompressionRatio(original, compressed) {
    const originalSize = typeof original === 'string' ? original.length : original.length;
    const compressedSize = typeof compressed === 'string' ? compressed.length : compressed.length;
    if (originalSize === 0) return 0;
    return ((originalSize - compressedSize) / originalSize * 100);
  }

  static isCompressed(data) {
    try {
      const buffer = Buffer.from(data, 'base64');
      // Check for gzip magic number
      return buffer.length >= 2 && buffer[0] === 0x1F && buffer[1] === 0x8B;
    } catch {
      return false;
    }
  }
}

module.exports = TemplateCompressor;