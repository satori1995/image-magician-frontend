<template>
  <div class="image-editor">
    <!-- 主要内容区域 -->
    <div class="editor-content">
      <!-- 左侧图像显示区域 -->
      <div class="image-area">
        <ImageDisplay
          :original-image="originalImage"
          :processed-image="processedImage"
          :zoom="zoom"
          :is-processing="isProcessing"
          :is-flashing="isFlashing"
          :is-revealing="isRevealing"
          @upload="handleUpload"
          @reupload="handleReupload"
        />

        <!-- 底部控制栏 -->
        <ControlBar
          v-if="hasImage"
          :zoom="zoom"
          :can-zoom-in="canZoomIn"
          :can-zoom-out="canZoomOut"
          @zoom-in="zoomIn"
          @zoom-out="zoomOut"
          @download="downloadImage"
        />
      </div>

      <!-- 右侧简化工具面板 -->
      <div class="simple-tool-panel">
        <div class="panel-header">
          <h2 class="panel-title">编辑工具</h2>
        </div>

        <div class="tool-list">
          <!-- 背景移除按钮 -->
          <button
            class="tool-btn"
            :class="{ 
              active: isProcessing && currentOperation === 'remove',
              completed: operationCompleted && currentOperation === 'remove'
            }"
            :disabled="!hasImage || isProcessing || operationCompleted"
            @click="handleRemoveBackground"
          >
            <span class="tool-icon">{{ (operationCompleted && currentOperation === 'remove') ? '✅' : '🖼️' }}</span>
            <span>{{ (operationCompleted && currentOperation === 'remove') ? '背景已移除' : '背景移除' }}</span>
            <span v-if="isProcessing && currentOperation === 'remove'" class="loading-spinner">⟳</span>
          </button>

          <!-- 背景模糊按钮组 -->
          <div class="tool-group">
            <button
              class="tool-btn blur-btn"
              :class="{ 
                active: isProcessing && currentOperation === 'blur',
                completed: operationCompleted && currentOperation === 'blur'
              }"
              :disabled="!hasImage || isProcessing || operationCompleted"
              @click="handleBlurBackground"
            >
              <span class="tool-icon">{{ (operationCompleted && currentOperation === 'blur') ? '✅' : '🌀' }}</span>
              <span>{{ (operationCompleted && currentOperation === 'blur') ? '背景已模糊' : '背景模糊' }}</span>
              <span v-if="isProcessing && currentOperation === 'blur'" class="loading-spinner">⟳</span>
            </button>
            
            <!-- 模糊半径滑动条 -->
            <div class="blur-slider-container">
              <div class="slider-header">
                <span class="slider-label">模糊强度</span>
                <span class="slider-value">{{ blurRadius }}</span>
              </div>
              <input 
                type="range" 
                v-model="blurRadius" 
                min="1" 
                max="10" 
                step="1"
                class="blur-slider"
                :disabled="!hasImage || operationCompleted"
              />
              <div class="slider-labels">
                <span>1</span>
                <span>10</span>
              </div>
            </div>
          </div>
        </div>

<!--        <div class="panel-footer">-->
<!--          <div class="tip-box">-->
<!--            <p class="tip-text">上传图像后，点击"背景移除"开始处理</p>-->
<!--          </div>-->
<!--        </div>-->
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-toast">
      <div class="error-content">
        <span>{{ error }}</span>
        <button @click="clearError" class="error-close">×</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import ImageDisplay from '@/components/ImageDisplay.vue'
import ControlBar from '@/components/ControlBar.vue'
import { useImageEditor } from '@/composables/useImageEditor.js'
import { useAnimation } from '@/composables/useAnimation.js'

export default {
  name: 'ImageEditor',
  components: {
    ImageDisplay,
    ControlBar
  },
  setup() {
    // 当前操作类型
    const currentOperation = ref(null)
    
    // 使用组合式函数
    const {
      originalImage,
      processedImage,
      zoom,
      isProcessing,
      error,
      operationCompleted,
      blurRadius,
      hasImage,
      hasProcessedImage,
      canZoomIn,
      canZoomOut,
      uploadImage,
      handleRemoveBackground: removeBackground,
      handleBlurBackground: blurBackground,
      zoomIn,
      zoomOut,
      downloadImage,
      clearError,
      reset
    } = useImageEditor()

    const {
      isFlashing,
      isRevealing,
      playProcessingAnimation
    } = useAnimation()

    /**
     * 处理文件上传
     */
    const handleUpload = async (file) => {
      try {
        await uploadImage(file)
      } catch (err) {
        console.error('上传失败:', err)
      }
    }

    /**
     * 处理背景移除
     */
    const handleRemoveBackground = async () => {
      try {
        console.log('开始背景移除...')
        currentOperation.value = 'remove'
        
        // 直接进行背景移除，不使用动画
        await removeBackground()
        
        console.log('背景移除完成!')

      } catch (err) {
        console.error('背景移除失败:', err)
        currentOperation.value = null
      }
    }

    /**
     * 处理背景模糊
     */
    const handleBlurBackground = async () => {
      try {
        console.log('开始背景模糊...')
        currentOperation.value = 'blur'
        
        // 直接进行背景模糊，不使用动画
        await blurBackground()
        
        console.log('背景模糊完成!')

      } catch (err) {
        console.error('背景模糊失败:', err)
        currentOperation.value = null
      }
    }

    /**
     * 处理清空图片
     */
    const handleClear = () => {
      // 重置所有状态
      reset()
      
      // 重置文件输入框（通过查找DOM元素）
      const fileInput = document.querySelector('input[type="file"]')
      if (fileInput) {
        fileInput.value = ''
      }
    }

    /**
     * 处理重新上传
     */
    const handleReupload = () => {
      // 重置所有状态
      reset()
      currentOperation.value = null
    }

    return {
      // 状态
      originalImage,
      processedImage,
      zoom,
      isProcessing,
      error,
      operationCompleted,
      blurRadius,
      currentOperation,
      isFlashing,
      isRevealing,

      // 计算属性
      hasImage,
      hasProcessedImage,
      canZoomIn,
      canZoomOut,

      // 方法
      handleUpload,
      handleRemoveBackground,
      handleBlurBackground,
      handleClear,
      handleReupload,
      zoomIn,
      zoomOut,
      downloadImage,
      clearError
    }
  }
}
</script>

<style scoped>
.image-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.editor-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.image-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 简化的工具面板 */
.simple-tool-panel {
  width: 300px;
  background: white;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  padding: 24px;
  border-bottom: 1px solid #f3f4f6;
}

.panel-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.tool-list {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tool-group {
  display: flex;
  flex-direction: column;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 20px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.blur-btn {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom: none;
  margin-bottom: 0;
}

.tool-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
}

.tool-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.tool-btn.completed {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.tool-icon {
  font-size: 1.5rem;
}

.loading-spinner {
  margin-left: auto;
  font-size: 1.2rem;
  animation: spin 1s linear infinite;
}

.panel-footer {
  padding: 24px;
  border-top: 1px solid #f3f4f6;
  background: #fafbfc;
}

.tip-box {
  padding: 16px;
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
}

.tip-text {
  color: #1e40af;
  font-size: 0.9rem;
  margin: 0;
  text-align: center;
}

/* 错误提示 */
.error-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  animation: slideInRight 0.3s ease-out;
}

.error-content {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 400px;
}

.error-close {
  background: none;
  border: none;
  color: #dc2626;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-close:hover {
  background: rgba(220, 38, 38, 0.1);
  border-radius: 50%;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 模糊滑动条样式 */
.blur-slider-container {
  background: white;
  border: 2px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 12px 12px;
  padding: 16px 20px;
  transition: all 0.3s ease;
  margin-top: 0;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.slider-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #6b7280;
}

.slider-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #3b82f6;
  background: #f0f9ff;
  padding: 4px 8px;
  border-radius: 6px;
}

.blur-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  margin-bottom: 8px;
  cursor: pointer;
  -webkit-appearance: none;
}

.blur-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.blur-slider::-webkit-slider-thumb:hover {
  background: #1d4ed8;
  transform: scale(1.1);
}

.blur-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.blur-slider:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.blur-slider:disabled::-webkit-slider-thumb {
  cursor: not-allowed;
  background: #9ca3af;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #9ca3af;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>