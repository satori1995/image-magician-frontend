import { ref, computed } from 'vue'
import { removeBackground } from '@/services/backgroundRemoval.js'
import { blurBackground } from '@/services/backgroundBlur.js'
import { readFileAsDataURL, validateFileType, validateFileSize, downloadBlob } from '@/services/fileHandler.js'
import { ZOOM_LIMITS, DEFAULT_SETTINGS } from '@/utils/constants.js'

export function useImageEditor() {
  // 响应式状态
  const originalImage = ref(null)
  const processedImage = ref(null)
  const currentFile = ref(null)
  const zoom = ref(DEFAULT_SETTINGS.DEFAULT_ZOOM)
  const isProcessing = ref(false)
  const error = ref(null)
  const operationCompleted = ref(false) // 跟踪是否已完成任何操作
  const blurRadius = ref(5) // 模糊半径，默认为5

  // 计算属性
  const hasImage = computed(() => !!originalImage.value)
  const hasProcessedImage = computed(() => !!processedImage.value)
  const canZoomIn = computed(() => zoom.value < ZOOM_LIMITS.MAX)
  const canZoomOut = computed(() => zoom.value > ZOOM_LIMITS.MIN)
  const displayImage = computed(() => processedImage.value || originalImage.value)

  /**
   * 上传图像文件
   */
  const uploadImage = async (file) => {
    try {
      error.value = null

      // 验证文件类型
      if (!validateFileType(file)) {
        throw new Error('不支持的文件类型，请选择图像文件')
      }

      // 验证文件大小
      if (!validateFileSize(file)) {
        throw new Error('文件过大，请选择小于 10MB 的图像')
      }

      // 读取文件
      const dataURL = await readFileAsDataURL(file)

      // 更新状态
      currentFile.value = file
      originalImage.value = dataURL
      processedImage.value = null
      zoom.value = DEFAULT_SETTINGS.DEFAULT_ZOOM
      operationCompleted.value = false // 重置操作状态

    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  /**
   * 移除背景
   */
  const handleRemoveBackground = async () => {
    if (!currentFile.value) {
      throw new Error('请先上传图像')
    }

    try {
      isProcessing.value = true
      error.value = null

      const resultBlob = await removeBackground(currentFile.value)
      const resultURL = URL.createObjectURL(resultBlob)
      
      // 调试日志
      console.log('Background removal successful:', {
        blobSize: resultBlob.size,
        blobType: resultBlob.type,
        resultURL: resultURL
      })
      
      processedImage.value = resultURL
      operationCompleted.value = true // 标记操作已完成
      console.log('processedImage.value set to:', processedImage.value)

    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * 模糊背景
   */
  const handleBlurBackground = async () => {
    if (!currentFile.value) {
      throw new Error('请先上传图像')
    }

    try {
      isProcessing.value = true
      error.value = null

      const resultBlob = await blurBackground(currentFile.value, {
        radius: blurRadius.value
      })
      const resultURL = URL.createObjectURL(resultBlob)
      
      // 调试日志
      console.log('Background blur successful:', {
        blobSize: resultBlob.size,
        blobType: resultBlob.type,
        resultURL: resultURL,
        radius: blurRadius.value
      })
      
      processedImage.value = resultURL
      operationCompleted.value = true // 标记操作已完成
      console.log('processedImage.value set to:', processedImage.value)

    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * 缩放控制
   */
  const zoomIn = () => {
    if (canZoomIn.value) {
      zoom.value = Math.min(zoom.value + ZOOM_LIMITS.STEP, ZOOM_LIMITS.MAX)
    }
  }

  const zoomOut = () => {
    if (canZoomOut.value) {
      zoom.value = Math.max(zoom.value - ZOOM_LIMITS.STEP, ZOOM_LIMITS.MIN)
    }
  }

  const resetZoom = () => {
    zoom.value = DEFAULT_SETTINGS.DEFAULT_ZOOM
  }

  /**
   * 下载图像
   */
  const downloadImage = async () => {
    const imageToDownload = processedImage.value || originalImage.value
    if (!imageToDownload) return

    try {
      if (processedImage.value) {
        // 下载处理后的图像（Blob URL）
        const response = await fetch(processedImage.value)
        const blob = await response.blob()
        downloadBlob(blob, 'processed_image.png')
      } else {
        // 下载原始图像
        downloadBlob(currentFile.value, currentFile.value.name)
      }
    } catch (err) {
      error.value = '下载失败: ' + err.message
    }
  }

  /**
   * 重置编辑器
   */
  const reset = () => {
    originalImage.value = null
    processedImage.value = null
    currentFile.value = null
    zoom.value = DEFAULT_SETTINGS.DEFAULT_ZOOM
    isProcessing.value = false
    error.value = null
    operationCompleted.value = false // 重置操作状态
    blurRadius.value = 5 // 重置模糊半径
  }

  /**
   * 清除错误
   */
  const clearError = () => {
    error.value = null
  }

  return {
    // 状态
    originalImage,
    processedImage,
    currentFile,
    zoom,
    isProcessing,
    error,
    operationCompleted,
    blurRadius,

    // 计算属性
    hasImage,
    hasProcessedImage,
    canZoomIn,
    canZoomOut,
    displayImage,

    // 方法
    uploadImage,
    handleRemoveBackground,
    handleBlurBackground,
    zoomIn,
    zoomOut,
    resetZoom,
    downloadImage,
    reset,
    clearError
  }
}
