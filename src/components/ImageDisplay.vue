<template>
  <div class="image-display-container">
    <div class="image-display" ref="displayRef">
      <!-- 上传区域 -->
      <div
        v-if="!originalImage"
        class="upload-area"
        @click="triggerFileInput"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
        :class="{ 'drag-over': isDragOver }"
      >
        <Upload class="upload-icon" :size="48" />
        <h3 class="upload-title">点击或拖拽上传图像</h3>
        <p class="upload-subtitle">支持 JPG、PNG、GIF、WebP 格式</p>
      </div>

      <!-- 图像显示区域 -->
      <div
        v-else
        class="image-container transparent-bg"
        :class="{ 
          'flash-effect': isFlashing,
          'processing-glow': isProcessing
        }"
        @contextmenu="handleContextMenu"
      >
        <!-- 原始图像 -->
        <img
          v-if="!processedImage"
          :src="originalImage"
          alt="原始图像"
          class="original-image"
          :class="{ 'processing-dim': isProcessing }"
          :style="imageStyle"
        />

        <!-- 处理后的图像 -->
        <img
          v-if="processedImage"
          :src="processedImage"
          alt="处理后的图像"
          class="processed-image"
          :style="imageStyle"
          @load="console.log('Processed image loaded successfully')"
          @error="console.error('Processed image failed to load')"
        />

        <!-- 加载覆盖层已移除 -->
        
        <!-- 闪烁星星动画 -->
        <TwinklingStars :show="isProcessing" :star-count="80" />

        <!-- 右键菜单 -->
        <div
          v-if="showContextMenu"
          class="context-menu"
          :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
          @click.stop
        >
          <div class="context-menu-item" @click="handleReupload">
            📁 重新上传
          </div>
        </div>
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      @change="handleFileChange"
      style="display: none;"
    />
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { Upload } from 'lucide-vue-next'
import LoadingOverlay from './LoadingOverlay.vue'
import TwinklingStars from './TwinklingStars.vue'
import { handleDropFiles } from '@/services/fileHandler.js'

export default {
  name: 'ImageDisplay',
  components: {
    Upload,
    LoadingOverlay,
    TwinklingStars
  },
  props: {
    originalImage: String,
    processedImage: String,
    zoom: {
      type: Number,
      default: 1
    },
    isProcessing: Boolean,
    isFlashing: Boolean,
    isRevealing: Boolean
  },
  emits: ['upload', 'reupload'],
  setup(props, { emit }) {
    const fileInputRef = ref(null)
    const displayRef = ref(null)
    const isDragOver = ref(false)
    const showContextMenu = ref(false)
    const contextMenuX = ref(0)
    const contextMenuY = ref(0)

    // 图像样式
    const imageStyle = computed(() => ({
      transform: `scale(${props.zoom})`,
      maxWidth: '100%',
      maxHeight: '100%'
    }))

    /**
     * 触发文件选择
     */
    const triggerFileInput = () => {
      fileInputRef.value?.click()
    }

    /**
     * 处理文件选择
     */
    const handleFileChange = (event) => {
      const file = event.target.files[0]
      if (file) {
        emit('upload', file)
      }
    }

    /**
     * 拖拽处理
     */
    const handleDragOver = (event) => {
      event.preventDefault()
      isDragOver.value = true
    }

    const handleDragLeave = (event) => {
      event.preventDefault()
      isDragOver.value = false
    }

    const handleDrop = (event) => {
      event.preventDefault()
      isDragOver.value = false

      const files = handleDropFiles(event)
      if (files.length > 0) {
        emit('upload', files[0])
      }
    }

    /**
     * 处理右键菜单
     */
    const handleContextMenu = (event) => {
      event.preventDefault()
      
      // 获取图像容器的边界
      const rect = event.currentTarget.getBoundingClientRect()
      contextMenuX.value = event.clientX - rect.left
      contextMenuY.value = event.clientY - rect.top
      showContextMenu.value = true

      // 点击其他地方时关闭菜单
      const closeMenu = () => {
        showContextMenu.value = false
        document.removeEventListener('click', closeMenu)
      }
      
      // 延迟添加事件监听器，避免立即触发
      setTimeout(() => {
        document.addEventListener('click', closeMenu)
      }, 0)
    }

    /**
     * 处理重新上传
     */
    const handleReupload = () => {
      showContextMenu.value = false
      // 重置文件输入框
      if (fileInputRef.value) {
        fileInputRef.value.value = ''
      }
      emit('reupload')
      // 触发文件选择
      triggerFileInput()
    }

    return {
      fileInputRef,
      displayRef,
      isDragOver,
      imageStyle,
      showContextMenu,
      contextMenuX,
      contextMenuY,
      triggerFileInput,
      handleFileChange,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleContextMenu,
      handleReupload
    }
  }
}
</script>

<style scoped>
.image-display-container {
  flex: 1;
  padding: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-display {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area {
  width: 100%;
  max-width: 600px;
  height: 400px;
  border: 2px dashed #d1d5db;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: #3b82f6;
  background: #f0f9ff;
  transform: scale(1.02);
}

.upload-icon {
  color: #9ca3af;
  margin-bottom: 16px;
}

.upload-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.upload-subtitle {
  color: #6b7280;
  font-size: 0.9rem;
}

.image-container {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  background: white;
}

/* 透明背景棋盘格效果 */
.transparent-bg {
  background-image: 
    linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
    linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

.original-image,
.processed-image {
  display: block;
  max-width: 800px;
  max-height: 600px;
  object-fit: contain;
  transition: all 0.2s ease;
}

/* 处理时图像变暗效果 */
.processing-dim {
  filter: brightness(0.4) saturate(0.7);
  transform: scale(0.98);
}

.original-image {
  position: relative;
  z-index: 1;
}

.processed-image {
  position: relative;
  z-index: 3;
}

/* 处理时的发光效果 */
.processing-glow {
  animation: processing-pulse 2s infinite ease-in-out;
  position: relative;
}

.processing-glow::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b);
  background-size: 400% 400%;
  border-radius: 20px;
  z-index: -1;
  animation: gradient-shift 3s ease infinite;
  opacity: 0.3;
  filter: blur(10px);
}

@keyframes processing-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 25px 50px rgba(59, 130, 246, 0.3);
  }
}

@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 右键菜单样式 */
.context-menu {
  position: absolute;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  min-width: 120px;
}

.context-menu-item {
  padding: 12px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.context-menu-item:hover {
  background-color: #f3f4f6;
}

</style>

