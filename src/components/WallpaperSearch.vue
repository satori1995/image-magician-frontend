<template>
  <div class="wallpaper-search" contenteditable="false">
    <!-- 搜索区域 -->
    <div class="search-section">
      <div class="search-container">
        <input 
          v-model="searchPrompt"
          type="text" 
          class="search-input"
          placeholder="输入提示词搜索壁纸..."
          @keyup.enter="handleSearch"
          ref="searchInput"
        />
        <button 
          class="search-button"
          @click="handleSearch"
          :disabled="isLoading"
        >
          {{ isLoading ? '搜索中...' : '搜索' }}
        </button>
      </div>
    </div>

    <!-- 图片展示区域 -->
    <div class="images-section">
      <div class="images-grid" v-if="images.length > 0">
        <div 
          v-for="image in images" 
          :key="image.image_id"
          class="image-item"
          @click="openImageModal(image)"
          @mouseenter="hoveredImageId = image.image_id"
          @mouseleave="hoveredImageId = null"
          @contextmenu.prevent
        >
          <!-- 图片 -->
          <img 
            :src="image.thumb_url" 
            :alt="image.prompt"
            class="thumbnail"
            @contextmenu.prevent
          />
          
          <!-- 尺寸信息 (左上角) -->
          <div class="size-info">
            {{ image.width }} × {{ image.height }}
          </div>
          
          <!-- 悬停时显示的提示词 (底部) -->
          <div 
            class="hover-overlay"
            :class="{ visible: hoveredImageId === image.image_id }"
          >
            <div class="prompt-text">
              {{ truncatePrompt(image.prompt) }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-indicator">
        <div class="loading-animation">
          <div class="loading-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
          <div class="loading-waves">
            <div class="wave"></div>
            <div class="wave"></div>
            <div class="wave"></div>
          </div>
        </div>
        <div class="loading-text">
          <h3>正在搜索精美壁纸</h3>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="!isLoading && images.length === 0 && hasSearched" class="empty-state">
        <p>没有找到相关壁纸，请尝试其他关键词</p>
      </div>
    </div>

    <!-- 图片详情弹窗 -->
    <div v-if="selectedImage" class="modal-overlay" @click="closeImageModal">
      <div class="modal-content" @click.stop>
        <button class="close-button-floating" @click="closeImageModal">×</button>
        
        <div class="modal-body">
          <div class="modal-content-wrapper">
            <!-- 左侧信息区域 -->
            <div class="image-info-section">
              <div class="image-details">
                <div class="detail-item size-item">
                  <strong>尺寸</strong>
                  <div class="size-content">{{ selectedImage.width }} × {{ selectedImage.height }}</div>
                </div>
                <div class="detail-item prompt-item">
                  <strong>提示词</strong>
                  <div class="prompt-content">{{ selectedImage.prompt || '无' }}</div>
                </div>
              </div>
              
            </div>
            
            <!-- 右侧图片区域 -->
            <div class="image-display-section">
              <div class="image-wrapper" @mouseenter="showDownloadButton = true" @mouseleave="showDownloadButton = false">
                <!-- 图片占位容器，使用原始图片尺寸 -->
                <div 
                  class="image-placeholder"
                  :class="{ 'loading': !imageLoaded }"
                  :style="{ 
                    width: getImageDisplayWidth() + 'px', 
                    height: getImageDisplayHeight() + 'px'
                  }"
                >
                  <img 
                    :src="selectedImage.hd_url" 
                    :alt="selectedImage.prompt"
                    class="full-image"
                    @contextmenu.prevent
                    @load="onImageLoad"
                    @error="onImageError"
                    :style="{ 
                      opacity: imageLoaded ? 1 : 0,
                      transition: 'opacity 0.3s ease'
                    }"
                    ref="modalImage"
                  />
                </div>
                
                <!-- 悬浮下载按钮 -->
                <div 
                  v-if="showDownloadButton && imageLoaded" 
                  class="download-btn"
                  :class="{ 'downloading': isDownloading }"
                  @click="downloadImage(selectedImage)"
                >
                  <div v-if="isDownloading" class="download-loading">
                    <div class="loading-spinner"></div>
                    <span class="download-progress">{{ Math.round(downloadProgress) }}%</span>
                  </div>
                  <span v-else class="download-icon">⬇</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { searchImages } from '../services/api.js'

export default {
  name: 'WallpaperSearch',
  data() {
    return {
      searchPrompt: '',
      images: [],
      cursor: 0,
      isLoading: false,
      hasSearched: false,
      hoveredImageId: null,
      selectedImage: null,
      lastSearchPrompt: '',
      scrollContainer: null,
      showDownloadButton: false,
      imageLoaded: false,
      isDownloading: false,
      downloadProgress: 0
    }
  },
  async mounted() {
    // 监听主内容区域的滚动
    const mainContent = this.$el.parentElement
    if (mainContent) {
      mainContent.addEventListener('scroll', this.handleScroll)
      this.scrollContainer = mainContent
    }
    
    
    // 页面加载时自动搜索
    await this.autoSearch()
  },
  beforeUnmount() {
    if (this.scrollContainer) {
      this.scrollContainer.removeEventListener('scroll', this.handleScroll)
    }
  },
  methods: {
    async handleSearch() {
      console.log('开始搜索:', this.searchPrompt)
      this.cursor = 0
      this.images = []
      this.lastSearchPrompt = this.searchPrompt
      this.hasSearched = true
      await this.fetchImages()
    },
    
    async autoSearch() {
      console.log('自动搜索开始')
      // 添加小延迟，让页面先完全加载
      await new Promise(resolve => setTimeout(resolve, 500))
      
      this.cursor = 0
      this.images = []
      this.lastSearchPrompt = '' // 空提示词
      this.hasSearched = true
      await this.fetchImages()
    },
    
    async fetchImages() {
      if (this.isLoading) return
      
      console.log('获取图片, cursor:', this.cursor, 'prompt:', this.lastSearchPrompt)
      this.isLoading = true
      
      try {
        const response = await searchImages({
          prompt: this.lastSearchPrompt || '',
          cursor: this.cursor
        })
        
        console.log('API响应:', response)
        
        if (response && response.code === 200 && response.data) {
          if (response.data.images && Array.isArray(response.data.images)) {
            this.images.push(...response.data.images)
            this.cursor = response.data.cursor || 0
            console.log('成功加载', response.data.images.length, '张图片')
          }
        } else {
          console.error('搜索失败:', response)
        }
      } catch (error) {
        console.error('搜索请求失败:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    handleScroll() {
      if (!this.scrollContainer) return
      
      const { scrollTop, scrollHeight, clientHeight } = this.scrollContainer
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        if (this.hasSearched && !this.isLoading && this.images.length > 0) {
          this.fetchImages()
        }
      }
    },
    
    truncatePrompt(prompt) {
      if (!prompt) return '无提示词'
      return prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt
    },
    
    openImageModal(image) {
      this.selectedImage = image
      this.imageLoaded = false
      this.showDownloadButton = false
    },
    
    closeImageModal() {
      this.selectedImage = null
      this.showDownloadButton = false
      this.imageLoaded = false
      this.isDownloading = false
      this.downloadProgress = 0
    },
    
    async downloadImage(image) {
      if (this.isDownloading) return // 防止重复点击
      
      try {
        this.isDownloading = true
        this.downloadProgress = 0
        console.log('开始下载图片:', image.hd_url)
        
        // 使用 fetch 获取图片数据，并追踪下载进度
        const response = await fetch(image.hd_url)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        // 获取文件总大小
        const contentLength = response.headers.get('content-length')
        const total = contentLength ? parseInt(contentLength, 10) : 0
        console.log('文件大小:', total, 'bytes')
        
        // 使用 ReadableStream 来追踪下载进度
        const reader = response.body.getReader()
        const chunks = []
        let receivedLength = 0
        
        // 逐块读取数据并更新进度
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break
          
          chunks.push(value)
          receivedLength += value.length
          
          // 更新真实下载进度
          if (total > 0) {
            this.downloadProgress = (receivedLength / total) * 100
          } else {
            // 如果无法获取总大小，根据已接收数据估算进度
            // 假设大部分图片在 1-5MB 之间
            const estimatedTotal = Math.max(receivedLength * 2, 2 * 1024 * 1024) // 至少假设2MB
            this.downloadProgress = Math.min(95, (receivedLength / estimatedTotal) * 100)
          }
          
          console.log(`下载进度: ${this.downloadProgress.toFixed(1)}% (${receivedLength}/${total || '未知'} bytes)`)
        }
        
        // 确保进度显示完成
        this.downloadProgress = 100
        console.log('图片数据下载完成，总大小:', receivedLength, 'bytes')
        
        // 创建 blob - 根据文件头判断图片类型
        let mimeType = 'image/jpeg' // 默认
        if (chunks.length > 0 && chunks[0].length > 4) {
          const firstBytes = chunks[0]
          // 检查文件头判断图片格式
          if (firstBytes[0] === 0x89 && firstBytes[1] === 0x50 && firstBytes[2] === 0x4E && firstBytes[3] === 0x47) {
            mimeType = 'image/png'
          } else if (firstBytes[0] === 0xFF && firstBytes[1] === 0xD8) {
            mimeType = 'image/jpeg'
          } else if (firstBytes[0] === 0x47 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46) {
            mimeType = 'image/gif'
          }
        }
        
        const blob = new Blob(chunks, { type: mimeType })
        console.log('Blob 创建成功，大小:', blob.size, 'bytes, 类型:', mimeType)
        
        // 创建下载链接
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        // 根据文件类型设置文件扩展名
        const extension = mimeType === 'image/png' ? 'png' : 
                         mimeType === 'image/gif' ? 'gif' : 'jpg'
        link.download = `wallpaper_${image.image_id}.${extension}`
        
        // 设置链接样式并添加到DOM
        link.style.display = 'none'
        document.body.appendChild(link)
        
        // 触发下载
        link.click()
        console.log('下载已触发，文件名:', link.download)
        
        // 立即清理DOM中的链接
        document.body.removeChild(link)
        
        // 延迟释放 URL 以确保下载完成
        setTimeout(() => {
          URL.revokeObjectURL(url)
          console.log('URL已释放')
        }, 10000) // 延长到10秒确保下载完成
        
        // 短暂显示完成状态后重置
        setTimeout(() => {
          this.isDownloading = false
          this.downloadProgress = 0
          console.log('下载状态已重置')
        }, 1500)
        
      } catch (error) {
        console.error('下载失败:', error)
        this.isDownloading = false
        this.downloadProgress = 0
        
        // 显示错误信息给用户
        alert(`下载失败: ${error.message}\n\n请检查网络连接或尝试右键点击图片另存为。`)
      }
    },
    
    onImageLoad() {
      console.log('图片加载完成')
      this.imageLoaded = true
    },
    
    onImageError() {
      this.imageLoaded = false
      console.error('图片加载失败')
    },
    
    getImageDisplayWidth() {
      if (!this.selectedImage) return 400
      const maxWidth = 700
      const maxHeight = 700
      const { width, height } = this.selectedImage
      
      if (width <= maxWidth && height <= maxHeight) {
        return width
      }
      
      const widthRatio = maxWidth / width
      const heightRatio = maxHeight / height
      const ratio = Math.min(widthRatio, heightRatio)
      
      return Math.round(width * ratio)
    },
    
    getImageDisplayHeight() {
      if (!this.selectedImage) return 300
      const maxWidth = 700
      const maxHeight = 700
      const { width, height } = this.selectedImage
      
      if (width <= maxWidth && height <= maxHeight) {
        return height
      }
      
      const widthRatio = maxWidth / width
      const heightRatio = maxHeight / height
      const ratio = Math.min(widthRatio, heightRatio)
      
      return Math.round(height * ratio)
    },
    
  }
}
</script>

<style scoped>
.wallpaper-search {
  height: 100%;
  display: flex;
  flex-direction: column;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* 搜索区域 */
.search-section {
  padding: 40px 30px;
}

.search-container {
  max-width: 90%;
  margin: 0 auto;
  display: flex;
  gap: 15px;
  align-items: stretch;
}

.search-input {
  flex: 1;
  padding: 18px 25px;
  border: none;
  border-radius: 30px;
  font-size: 18px;
  outline: none;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.4s ease;
  color: #333;
  box-sizing: border-box;
  min-width: 0;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
}

.search-input:focus {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 12px 40px rgba(0, 123, 255, 0.2);
  transform: translateY(-2px);
}

.search-input::placeholder {
  color: #8a9ba8;
  font-weight: 400;
}

.search-button {
  padding: 18px 35px;
  background: linear-gradient(135deg, #53bcea 0%, #1bb16e 100%);
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.4s ease;
  min-width: 140px;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.search-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, #6ce3da 0%, #bf6fed 100%);
}

.search-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.search-button:hover::before {
  left: 100%;
}

.search-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 图片展示区域 */
.images-section {
  padding: 30px;
  width: 100%;
  box-sizing: border-box;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  width: 100%;
  margin: 0;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.image-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  width: 100%;
  min-width: 300px;
}

.image-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.thumbnail {
  width: 100%;
  height: 280px;
  object-fit: cover;
  display: block;
  flex-shrink: 0;
}

.size-info {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.hover-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: 20px 15px 15px;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.hover-overlay.visible {
  transform: translateY(0);
}

.prompt-text {
  font-size: 14px;
  line-height: 1.4;
}

/* 加载状态 */
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  min-height: 400px;
}

.loading-animation {
  position: relative;
  margin-bottom: 40px;
}

.loading-dots {
  display: flex;
  gap: 8px;
  margin-bottom: 30px;
  justify-content: center;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(45deg, #667eea, #764ba2);
  animation: dotPulse 1.4s ease-in-out infinite both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }
.dot:nth-child(3) { animation-delay: 0s; }
.dot:nth-child(4) { animation-delay: 0.16s; }
.dot:nth-child(5) { animation-delay: 0.32s; }

.loading-waves {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
}

.wave {
  width: 6px;
  height: 40px;
  background: linear-gradient(to top, #667eea, #764ba2);
  border-radius: 3px;
  animation: waveStretch 1.2s ease-in-out infinite;
}

.wave:nth-child(1) { animation-delay: -0.4s; }
.wave:nth-child(2) { animation-delay: -0.2s; }
.wave:nth-child(3) { animation-delay: 0s; }

.loading-text {
  text-align: center;
  max-width: 400px;
}

.loading-text h3 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 15px 0;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.loading-text p {
  font-size: 16px;
  color: #666;
  margin: 0;
  line-height: 1.6;
  opacity: 0.8;
}

@keyframes dotPulse {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes waveStretch {
  0%, 40%, 100% {
    transform: scaleY(0.4);
    opacity: 0.6;
  }
  20% {
    transform: scaleY(1);
    opacity: 1;
  }
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #6c757d;
  font-size: 18px;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 10px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 1400px;
  max-width: 95vw;
  max-height: 95vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  position: relative;
}

.close-button-floating {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: white;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  z-index: 10;
  backdrop-filter: blur(10px);
}

.close-button-floating:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

.modal-body {
  padding: 30px;
  min-height: 0;
  overflow-y: auto;
  flex: 1;
}

.modal-content-wrapper {
  display: flex;
  gap: 30px;
  align-items: stretch;
  height: 100%;
}

.image-info-section {
  flex: 0 0 400px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.image-display-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.image-wrapper {
  position: relative;
  display: inline-block;
}

.image-placeholder {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e9ecef;
  background: #f8f9fa;
}

.image-placeholder.loading {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}


.full-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}


.image-details {
  margin-bottom: 30px;
  min-width: 0;
  flex: 1;
}

.detail-item {
  margin-bottom: 15px;
  font-size: 16px;
  line-height: 1.5;
}

.prompt-item,
.size-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.prompt-item strong,
.size-item strong {
  margin-bottom: 8px;
  margin-right: 0;
}

.prompt-content,
.size-content {
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 8px;
  width: 100%;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #555;
  line-height: 1.6;
}

.prompt-content {
  border-left: 4px solid #667eea;
  word-wrap: break-word;
  word-break: break-word;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
  min-height: 0;
}

.size-content {
  border-left: 4px solid #28a745;
  font-weight: 600;
  font-size: 18px;
  text-align: left;
  color: #333;
}

.detail-item strong {
  color: #333;
  margin-right: 10px;
}

/* 悬浮下载按钮样式 */
.download-btn {
  position: absolute;
  bottom: 15px;
  right: 15px;
  width: 44px;
  height: 44px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.download-btn.downloading {
  width: 60px;
  height: 60px;
  background: rgba(0, 0, 0, 0.8);
  cursor: default;
  border-color: rgba(76, 175, 80, 0.4);
}

.download-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transform: scale(0);
  animation: pulse 2s infinite;
}

.image-wrapper:hover .download-btn {
  opacity: 1;
  transform: translateY(-2px);
}

.download-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
}

.download-btn:hover::before {
  animation-play-state: paused;
}

.download-icon {
  font-size: 22px;
  color: white;
  font-weight: bold;
  z-index: 1;
  position: relative;
}

.download-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
  position: relative;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 2px;
}

.download-progress {
  font-size: 10px;
  color: white;
  font-weight: bold;
  text-align: center;
  line-height: 1;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  70% {
    transform: scale(1);
    opacity: 0.3;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .modal-content {
    width: 95vw;
  }
  
  .modal-content-wrapper {
    flex-direction: column;
    gap: 20px;
  }
  
  .image-info-section {
    flex: none;
    order: 2;
  }
  
  .image-display-section {
    flex: none;
    order: 1;
  }
  
  .full-image {
    max-height: 500px;
  }
}
</style>