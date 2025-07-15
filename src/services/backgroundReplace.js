import { replaceBackground } from './api.js'

/**
 * 执行背景替换
 * @param {File|Blob} imageFile - 要处理的图像文件
 * @param {Object} backgroundImage - 背景图片信息
 * @returns {Promise<Blob>} 替换背景后的图像
 */
export const performBackgroundReplace = async (imageFile, backgroundImage) => {
  if (!imageFile) {
    throw new Error('请提供要处理的图像文件')
  }

  if (!backgroundImage) {
    throw new Error('请选择背景图片')
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
    console.log('开始背景替换:', {
      fileName: imageFile.name || 'unknown',
      fileSize: (imageFile.size / 1024 / 1024).toFixed(2) + 'MB',
      fileType: imageFile.type,
      backgroundImage: backgroundImage
    })

    const resultBlob = await replaceBackground(imageFile, backgroundImage)

    console.log('背景替换成功')
    return resultBlob

  } catch (error) {
    console.error('背景替换失败:', error)

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