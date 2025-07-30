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
        <div class="modal-header">
          <h3>壁纸详情</h3>
          <button class="close-button" @click="closeImageModal">×</button>
        </div>
        
        <div class="modal-body">
          <img 
            :src="selectedImage.hd_url" 
            :alt="selectedImage.prompt"
            class="full-image"
            @contextmenu.prevent
          />
          
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
          
          <div class="modal-actions">
            <button 
              class="download-button"
              @click="downloadImage(selectedImage)"
            >
              下载原图
            </button>
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
      scrollContainer: null
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
    },
    
    closeImageModal() {
      this.selectedImage = null
    },
    
    downloadImage(image) {
      const link = document.createElement('a')
      link.href = image.hd_url
      link.download = `wallpaper_${image.image_id}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
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
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 800px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #f8f9fa;
  color: #333;
}

.modal-body {
  padding: 30px;
  min-height: 0;
  overflow-y: auto;
  flex: 1;
}

.full-image {
  width: 100%;
  max-width: 800px;
  height: auto;
  border-radius: 8px;
  margin-bottom: 20px;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.image-details {
  margin-bottom: 30px;
  min-width: 0;
  flex-shrink: 1;
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
  max-height: 150px;
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

.modal-actions {
  text-align: center;
}

.download-button {
  padding: 12px 30px;
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.download-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);
}
</style>