import { SUPPORTED_FILE_TYPES, DEFAULT_SETTINGS } from '@/utils/constants.js'

/**
 * 验证文件类型
 * @param {File} file - 要验证的文件
 * @returns {boolean} 是否为支持的文件类型
 */
export const validateFileType = (file) => {
  return SUPPORTED_FILE_TYPES.includes(file.type)
}

/**
 * 验证文件大小
 * @param {File} file - 要验证的文件
 * @param {number} maxSize - 最大文件大小（字节）
 * @returns {boolean} 文件大小是否符合要求
 */
export const validateFileSize = (file, maxSize = DEFAULT_SETTINGS.MAX_FILE_SIZE) => {
  return file.size <= maxSize
}

/**
 * 读取文件为 Data URL
 * @param {File} file - 要读取的文件
 * @returns {Promise<string>} Data URL 字符串
 */
export const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

/**
 * 从 Data URL 创建 Blob
 * @param {string} dataURL - Data URL 字符串
 * @returns {Blob} Blob 对象
 */
export const dataURLToBlob = (dataURL) => {
  const arr = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }

  return new Blob([u8arr], { type: mime })
}

/**
 * 下载 Blob 为文件
 * @param {Blob} blob - 要下载的 Blob
 * @param {string} filename - 文件名
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 获取文件信息
 * @param {File} file - 文件对象
 * @returns {Object} 文件信息
 */
export const getFileInfo = (file) => {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    sizeFormatted: formatFileSize(file.size)
  }
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 压缩图像
 * @param {File} file - 原始文件
 * @param {number} quality - 压缩质量 (0-1)
 * @param {number} maxWidth - 最大宽度
 * @param {number} maxHeight - 最大高度
 * @returns {Promise<Blob>} 压缩后的图像 Blob
 */
export const compressImage = (file, quality = 0.8, maxWidth = 1920, maxHeight = 1080) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // 计算新的尺寸
      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }

      canvas.width = width
      canvas.height = height

      // 绘制图像
      ctx.drawImage(img, 0, 0, width, height)

      // 转换为 Blob
      canvas.toBlob(resolve, file.type, quality)
    }

    img.onerror = () => reject(new Error('图像加载失败'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 处理拖拽文件
 * @param {DragEvent} event - 拖拽事件
 * @returns {File[]} 文件数组
 */
export const handleDropFiles = (event) => {
  event.preventDefault()
  const files = []

  if (event.dataTransfer.items) {
    // 使用 DataTransferItemList 接口
    for (let i = 0; i < event.dataTransfer.items.length; i++) {
      const item = event.dataTransfer.items[i]
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (validateFileType(file)) {
          files.push(file)
        }
      }
    }
  } else {
    // 使用 FileList 接口
    for (let i = 0; i < event.dataTransfer.files.length; i++) {
      const file = event.dataTransfer.files[i]
      if (validateFileType(file)) {
        files.push(file)
      }
    }
  }

  return files
}

