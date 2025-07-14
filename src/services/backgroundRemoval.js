import { processImage } from './api.js'
import { API_ENDPOINTS } from '@/utils/constants.js'

/**
 * 移除图像背景
 * @param {File|Blob} imageFile - 要处理的图像文件
 * @param {Object} options - 处理选项
 * @returns {Promise<Blob>} 移除背景后的图像
 */
export const removeBackground = async (imageFile, options = {}) => {
  if (!imageFile) {
    throw new Error('请提供要处理的图像文件')
  }

  // 检查文件类型
  if (!imageFile.type.startsWith('image/')) {
    throw new Error('只支持图像文件')
  }

  // 检查文件大小 (10MB 限制)
  const maxSize = 10 * 1024 * 1024
  if (imageFile.size > maxSize) {
    throw new Error('文件过大，请选择小于 10MB 的图像')
  }

  try {
    console.log('开始移除背景:', {
      fileName: imageFile.name || 'unknown',
      fileSize: (imageFile.size / 1024 / 1024).toFixed(2) + 'MB',
      fileType: imageFile.type
    })

    const resultBlob = await processImage(
      API_ENDPOINTS.REMOVE_BACKGROUND,
      imageFile,
      options
    )

    console.log('背景移除成功')
    return resultBlob

  } catch (error) {
    console.error('背景移除失败:', error)

    // 根据错误类型提供更友好的错误信息
    if (error.message.includes('timeout')) {
      throw new Error('处理超时，请尝试使用更小的图像文件')
    } else if (error.message.includes('413')) {
      throw new Error('图像文件过大，请压缩后重试')
    } else if (error.message.includes('500')) {
      throw new Error('服务器处理错误，请稍后重试')
    } else {
      throw error
    }
  }
}

/**
 * 批量移除背景
 * @param {File[]} imageFiles - 图像文件数组
 * @param {Function} onProgress - 进度回调函数
 * @returns {Promise<Blob[]>} 处理结果数组
 */
export const batchRemoveBackground = async (imageFiles, onProgress) => {
  const results = []

  for (let i = 0; i < imageFiles.length; i++) {
    try {
      const result = await removeBackground(imageFiles[i])
      results.push(result)

      if (onProgress) {
        onProgress({
          current: i + 1,
          total: imageFiles.length,
          progress: ((i + 1) / imageFiles.length) * 100
        })
      }
    } catch (error) {
      console.error(`处理第 ${i + 1} 个文件失败:`, error)
      results.push(null) // 失败的文件用 null 占位
    }
  }

  return results
}

