class FingerprintParser {
  static parseTemplate(template) {
    try {
      if (typeof template === 'string') {
        // Try JSON
        try {
          return JSON.parse(template);
        } catch {
          // Try base64
          try {
            const decoded = Buffer.from(template, 'base64').toString();
            return JSON.parse(decoded);
          } catch {
            return { raw: template };
          }
        }
      }
      return template;
    } catch (error) {
      console.error('Template parsing error:', error);
      return { raw: template };
    }
  }

  static extractMinutiae(template) {
    try {
      const parsed = this.parseTemplate(template);
      return parsed.minutiae || [];
    } catch {
      return [];
    }
  }

  static extractQuality(template) {
    try {
      const parsed = this.parseTemplate(template);
      return parsed.quality || parsed.imageQuality || 70;
    } catch {
      return 70;
    }
  }

  static extractFormat(template) {
    try {
      const parsed = this.parseTemplate(template);
      return parsed.format || 'ISO_19794_2';
    } catch {
      return 'ISO_19794_2';
    }
  }

  static serializeMinutiae(minutiae) {
    return {
      format: 'ISO_19794_2',
      version: '1.0',
      minutiae: minutiae.map(m => ({
        x: m.x || 0,
        y: m.y || 0,
        angle: m.angle || 0,
        type: m.type || 'unknown'
      })),
      timestamp: new Date().toISOString()
    };
  }

  static validateMinutiae(minutiae) {
    if (!Array.isArray(minutiae)) return false;
    if (minutiae.length === 0) return false;
    
    for (const m of minutiae) {
      if (typeof m.x !== 'number' || typeof m.y !== 'number') return false;
      if (m.x < 0 || m.x > 500 || m.y < 0 || m.y > 500) return false;
    }
    
    return true;
  }

  static calculateMinutiaeDensity(minutiae, width = 400, height = 400) {
    if (!minutiae || minutiae.length === 0) return 0;
    const area = width * height;
    return (minutiae.length / area) * 1000000; // per million pixels
  }

  static getMinutiaeTypeStats(minutiae) {
    const stats = {
      total: 0,
      ridgeEndings: 0,
      bifurcations: 0,
      other: 0
    };

    for (const m of minutiae) {
      stats.total++;
      if (m.type === 'ridge_ending' || m.type === 'ending') {
        stats.ridgeEndings++;
      } else if (m.type === 'bifurcation' || m.type === 'bifur') {
        stats.bifurcations++;
      } else {
        stats.other++;
      }
    }

    return stats;
  }

  static getMinutiaeDistribution(minutiae, gridSize = 5) {
    const distribution = [];
    
    for (let i = 0; i < gridSize; i++) {
      distribution[i] = [];
      for (let j = 0; j < gridSize; j++) {
        distribution[i][j] = 0;
      }
    }

    for (const m of minutiae) {
      const x = Math.floor((m.x / 400) * gridSize);
      const y = Math.floor((m.y / 400) * gridSize);
      if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
        distribution[x][y]++;
      }
    }

    return distribution;
  }
}

module.exports = FingerprintParser;