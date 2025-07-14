// API 端点
export const API_ENDPOINTS = {
  REMOVE_BACKGROUND: '/api/remove_bg',
  BLUR_BACKGROUND: '/api/blur_bg',
}

// 支持的文件类型
export const SUPPORTED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
]

// 缩放限制
export const ZOOM_LIMITS = {
  MIN: 0.1,
  MAX: 5,
  STEP: 0.2
}

// 动画持续时间
export const ANIMATION_DURATION = {
  FLASH: 1500,
  REVEAL: 1000,
  FADE: 300
}

// 工具类型
export const TOOL_TYPES = {
  REMOVE_BACKGROUND: 'remove_background',
  ERASE: 'erase',
  EFFECTS: 'effects',
  ADJUST: 'adjust'
}

// 默认设置
export const DEFAULT_SETTINGS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  IMAGE_QUALITY: 0.9,
  DEFAULT_ZOOM: 1
}

