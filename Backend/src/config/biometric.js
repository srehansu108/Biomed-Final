module.exports = {
  FINGER_TYPES: {
    RIGHT_THUMB: 'right_thumb',
    RIGHT_INDEX: 'right_index',
    RIGHT_MIDDLE: 'right_middle',
    RIGHT_RING: 'right_ring',
    RIGHT_LITTLE: 'right_little',
    LEFT_THUMB: 'left_thumb',
    LEFT_INDEX: 'left_index',
    LEFT_MIDDLE: 'left_middle',
    LEFT_RING: 'left_ring',
    LEFT_LITTLE: 'left_little'
  },

  QUALITY_THRESHOLDS: {
    EXCELLENT: 85,
    GOOD: 70,
    FAIR: 50,
    POOR: 30
  },

  SCANNER: {
    TIMEOUT: 30000,
    MAX_RETRY: 3,
    MIN_TEMPLATE_SIZE: 100,
    QUALITY_THRESHOLD: 70
  },

  TEMPLATE_FORMATS: {
    ISO_19794_2: 'ISO_19794_2',
    ANSI_378: 'ANSI_378',
    MFS100: 'MFS100',
    CUSTOM: 'CUSTOM'
  },

  VERIFICATION_TYPES: {
    ONE_TO_ONE: '1:1',
    ONE_TO_MANY: '1:N',
    MANY_TO_ONE: 'N:1'
  }
};