<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>背景替换</h2>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>

      <div class="modal-body">
        <!-- 提示词输入 -->
        <div class="input-section">
          <label for="prompt-input">输入提示词</label>
          <div class="input-group">
            <input
              id="prompt-input"
              v-model="prompt"
              type="text"
              placeholder="请输入背景描述，例如：海边、森林、城市等..."
              class="prompt-input"
              @keyup.enter="searchImages"
            />
            <button
              class="btn btn-primary search-btn"
              @click="searchImages"
              :disabled="isLoading"
            >
              搜索
            </button>
          </div>
        </div>

        <!-- 图片展示区域 -->
        <div v-if="images.length > 0" class="images-section">
          <h3>选择背景图片</h3>
          <div class="images-grid">
            <div
              v-for="image in images"
              :key="image.id"
              class="image-item"
              :class="{ selected: selectedImageId === image.id }"
              @click="showImagePreview(image)"
              @contextmenu.prevent="handleRightClick($event, image)"
            >
              <img 
                :src="image.url" 
                :alt="`背景图片 ${image.id}`"
              />
              <div class="image-overlay">
                <div class="image-info">
                  {{ image.width }} × {{ image.height }}
                </div>
              </div>
              <!-- 选中状态的对钩标记 -->
              <div v-if="selectedImageId === image.id" class="selected-checkmark">
                <div class="checkmark-circle">
                  <span class="checkmark-icon">✓</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 换一批按钮 -->
          <div class="actions">
            <button
              class="btn btn-secondary"
              @click="loadMoreImages"
              :disabled="isLoading"
            >
              <span v-if="isLoading">加载中...</span>
              <span v-else>换一批</span>
            </button>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading && images.length === 0" class="loading-section">
          <div class="loading-spinner">⟳</div>
          <p>正在加载背景图片...</p>
        </div>

        <!-- 错误信息 -->
        <div v-if="error" class="error-section">
          <p class="error-message">{{ error }}</p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeModal">取消</button>
        <button
          class="btn btn-primary"
          @click="handleConfirm"
          :disabled="selectedImageId === null"
        >
          确认
        </button>
      </div>
    </div>

    <!-- 自定义右键菜单 -->
    <ContextMenu
      :key="contextMenu.key"
      :visible="contextMenu.visible"
      :position="contextMenu.position"
      @select="handleContextMenuSelect"
    />

    <!-- 图片预览模态框 -->
    <div v-if="showPreview" class="image-preview-overlay" @click="closeImagePreview">
      <div class="image-preview-content" @click.stop>
        <button class="preview-close-btn" @click="closeImagePreview">&times;</button>
        <img 
          :src="previewImage?.url" 
          :alt="`预览图片 ${previewImage?.id}`"
          class="preview-image"
        />
        <div class="preview-info">
          <span class="preview-size">{{ previewImage?.width }} × {{ previewImage?.height }}</span>
          <button 
            class="preview-select-btn"
            @click="selectImageFromPreview"
          >
            选择此图片
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { getBackgroundImages } from '@/services/api.js'
import ContextMenu from './ContextMenu.vue'

export default {
  name: 'BackgroundReplaceModal',
  components: {
    ContextMenu
  },
  emits: ['close', 'confirm'],
  setup(props, { emit }) {
    const prompt = ref('')
    const images = ref([])
    const selectedImageId = ref(null)
    const cursor = ref(null)
    const isLoading = ref(false)
    const error = ref('')
    
    // 右键菜单状态
    const contextMenu = ref({
      visible: false,
      position: { x: 0, y: 0 },
      targetImage: null,
      key: 0
    })

    // 图片预览状态
    const showPreview = ref(false)
    const previewImage = ref(null)

    /**
     * 加载背景图片
     */
    const loadBackgroundImages = async (resetImages = false) => {
      try {
        isLoading.value = true
        error.value = ''
        
        const currentCursor = resetImages ? null : cursor.value
        const result = await getBackgroundImages(prompt.value, currentCursor)
        
        if (resetImages) {
          images.value = result.images
        } else {
          images.value = [...images.value, ...result.images]
        }
        
        cursor.value = result.cursor
        
      } catch (err) {
        console.error('加载背景图片失败:', err)
        error.value = err.message || '加载失败，请重试'
      } finally {
        isLoading.value = false
      }
    }

    /**
     * 加载更多图片（换一批）
     */
    const loadMoreImages = async () => {
      await loadBackgroundImages(false)
    }

    /**
     * 搜索图片
     */
    const searchImages = async () => {
      selectedImageId.value = null
      cursor.value = null
      await loadBackgroundImages(true)
    }

    /**
     * 选择图片
     */
    const selectImage = (imageId) => {
      selectedImageId.value = imageId
      // 选择图片时关闭右键菜单
      closeContextMenu()
    }

    /**
     * 显示图片预览
     */
    const showImagePreview = (image) => {
      previewImage.value = image
      showPreview.value = true
      // 关闭右键菜单
      closeContextMenu()
    }

    /**
     * 关闭图片预览
     */
    const closeImagePreview = () => {
      showPreview.value = false
      previewImage.value = null
    }

    /**
     * 从预览中选择图片
     */
    const selectImageFromPreview = () => {
      if (previewImage.value) {
        selectImage(previewImage.value.id)
        closeImagePreview()
      }
    }

    /**
     * 处理右键点击
     */
    const handleRightClick = (event, image) => {
      // 创建全新的菜单对象
      const newMenu = {
        visible: true,
        position: { x: event.clientX, y: event.clientY },
        targetImage: image,
        key: Date.now() + Math.random()
      }
      
      // 完全替换菜单对象
      contextMenu.value = newMenu
    }

    /**
     * 关闭右键菜单
     */
    const closeContextMenu = () => {
      contextMenu.value.visible = false
      contextMenu.value.targetImage = null
    }

    /**
     * 处理右键菜单选择
     */
    const handleContextMenuSelect = () => {
      if (contextMenu.value.targetImage) {
        selectImage(contextMenu.value.targetImage.id)
      }
      closeContextMenu()
    }

    /**
     * 处理遮罩层点击
     */
    const handleOverlayClick = () => {
      if (contextMenu.value.visible) {
        // 如果右键菜单显示，先关闭右键菜单
        closeContextMenu()
      } else {
        // 否则关闭模态框
        closeModal()
      }
    }

    /**
     * 关闭模态框
     */
    const closeModal = () => {
      emit('close')
    }

    /**
     * 确认操作
     */
    const handleConfirm = async () => {
      if (selectedImageId.value === null) {
        return
      }

      const result = {
        prompt: prompt.value,
        selectedImage: images.value.find(img => img.id === selectedImageId.value)
      }
      
      emit('confirm', result)
    }

    /**
     * 全局点击事件处理
     */
    const handleGlobalClick = (event) => {
      // 如果菜单显示且点击的不是右键菜单，则关闭菜单
      if (contextMenu.value.visible) {
        const contextMenuElement = document.querySelector('.context-menu')
        if (contextMenuElement && !contextMenuElement.contains(event.target)) {
          closeContextMenu()
        }
      }
    }

    // 组件挂载时获取初始数据
    onMounted(() => {
      // 添加全局点击事件监听器
      document.addEventListener('click', handleGlobalClick)
    })

    // 组件卸载时移除事件监听器
    onUnmounted(() => {
      document.removeEventListener('click', handleGlobalClick)
    })

    return {
      prompt,
      images,
      selectedImageId,
      isLoading,
      error,
      contextMenu,
      showPreview,
      previewImage,
      loadBackgroundImages,
      loadMoreImages,
      searchImages,
      selectImage,
      showImagePreview,
      closeImagePreview,
      selectImageFromPreview,
      handleRightClick,
      closeContextMenu,
      handleContextMenuSelect,
      handleOverlayClick,
      closeModal,
      handleConfirm
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.input-section {
  margin-bottom: 24px;
}

.input-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
}

.input-group {
  display: flex;
  gap: 8px;
}

.prompt-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;
}

.prompt-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.search-btn {
  flex-shrink: 0;
}

.images-section {
  margin-top: 24px;
}

.images-section h3 {
  margin: 0 0 16px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.image-item {
  position: relative;
  aspect-ratio: 4/3;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
}

.image-item:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.image-item.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  padding: 12px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.image-info {
  font-size: 0.9rem;
  font-weight: 500;
}

/* 选中状态的对钩标记 */
.selected-checkmark {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.checkmark-circle {
  width: 24px;
  height: 24px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  animation: checkmark-appear 0.2s ease-out;
}

.checkmark-icon {
  color: white;
  font-size: 14px;
  font-weight: bold;
  line-height: 1;
}

@keyframes checkmark-appear {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.actions {
  display: flex;
  justify-content: center;
}

.loading-section {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.loading-spinner {
  font-size: 2rem;
  margin-bottom: 16px;
  animation: spin 1s linear infinite;
}

.error-section {
  text-align: center;
  padding: 20px;
}

.error-message {
  color: #dc2626;
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 图片预览样式 */
.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: preview-fade-in 0.2s ease-out;
}

.image-preview-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  animation: preview-scale-in 0.3s ease-out;
}

.preview-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  z-index: 10;
  transition: all 0.2s ease;
}

.preview-close-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

.preview-image {
  width: 100%;
  height: auto;
  max-height: 70vh;
  object-fit: contain;
  display: block;
}

.preview-info {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.preview-size {
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
}

.preview-select-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.preview-select-btn:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

@keyframes preview-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes preview-scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

</style>