<template>
  <div class="anime-image" contenteditable="false" @contextmenu.prevent>
    <!-- 隐藏的文件输入，始终存在 -->
    <input 
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
      @change="handleFileSelect"
      style="display: none"
    />
    
    <!-- 上传区域 -->
    <div v-if="!originalImage" class="upload-section">
      <div class="upload-container">
        <div 
          class="upload-area"
          @click="triggerFileUpload"
          @dragover.prevent
          @dragenter.prevent
          @drop.prevent="handleFileDrop"
        >
          <div class="upload-icon">📸</div>
          <h3>上传图片进行动漫化</h3>
          <p>点击选择图片或拖拽图片到此处</p>
          <p class="upload-hint">支持 JPG、PNG、GIF、WebP 格式，最大 5MB</p>
          <button class="upload-button">选择图片</button>
        </div>
      </div>
    </div>

    <!-- 图片展示区域 -->
    <div v-if="originalImage" class="image-display-layout">
      <!-- 中间图片区域 -->
      <div class="center-content">
        <div class="image-container">
          <div 
            class="image-wrapper" 
            @contextmenu.prevent
            @mouseenter="showDownloadButton = true"
            @mouseleave="showDownloadButton = false"
          >
            <!-- 图片显示 -->
            <img 
              :src="currentDisplayImage" 
              alt="图片" 
              :class="{ 'processing': isProcessing }"
              @contextmenu.prevent
            />
            
            <!-- 下载按钮（仅在处理完成后显示） -->
            <div 
              v-if="isProcessed && showDownloadButton" 
              class="download-btn"
              @click="downloadAnimeImage"
            >
              <span class="download-icon">⬇</span>
            </div>
            
            <!-- 处理中的闪烁星星效果 -->
            <div v-if="isProcessing" class="processing-overlay">
              <div class="processing-stars">
                <span 
                  v-for="(star, index) in stars" 
                  :key="index"
                  class="processing-star"
                  :style="{ 
                    left: star.x + '%', 
                    top: star.y + '%',
                    animationDelay: star.delay + 's',
                    fontSize: (star.size * 24) + 'px'
                  }"
                >
                  ✨
                </span>
              </div>
              <div class="processing-text">
                <h4>AI 正在处理中...</h4>
              </div>
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="action-buttons">
            <button 
              v-if="!isProcessed"
              class="process-button" 
              @click="startProcessing"
              :disabled="isProcessing"
            >
              <span class="button-icon">🎨</span>
              {{ isProcessing ? '处理中...' : '动漫化处理' }}
            </button>
            
            <button 
              class="reupload-button" 
              @click="reuploadImage"
              :disabled="isProcessing"
            >
              <span class="button-icon">🔄</span>
              {{ isProcessing ? '处理中...' : '重新上传图片' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧风格选择边栏（绝对定位，独立于主内容区域） -->
    <div v-if="originalImage" class="style-sidebar">
      <div class="style-options">
        <div 
          v-for="style in styleOptions" 
          :key="style.value"
          class="style-option"
          :class="{ 'selected': selectedStyle === style.value }"
          @click="selectStyle(style.value)"
        >
          <div class="style-icon">{{ style.icon }}</div>
          <div class="style-name">{{ style.name }}</div>
          <div class="style-description">{{ style.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { animateImage } from '../services/api.js'

export default {
  name: 'AnimeImage',
  data() {
    return {
      originalImage: null,
      animeImage: null,
      isProcessing: false,
      isProcessed: false,
      currentFile: null,
      stars: [], // 存储星星的位置和动画延迟
      showDownloadButton: false,
      selectedStyle: '吉卜力风格', // 默认选择吉卜力风格
      styleOptions: [
        {
          name: '吉卜力风格',
          value: '吉卜力风格',
          icon: '🌿',
          description: '温暖自然的手绘风格'
        },
        {
          name: '赛博朋克风格',
          value: '赛博朋克风格',
          icon: '🤖',
          description: '未来感科技风格'
        },
        {
          name: '少年风格',
          value: '少年风格',
          icon: '⚡',
          description: '热血青春动漫风格'
        },
        {
          name: 'Kawaii风格',
          value: 'Kawaii风格',
          icon: '💕',
          description: '可爱甜美风格'
        },
        {
          name: '奇比风格',
          value: '奇比风格',
          icon: '🧸',
          description: 'Q版萌系风格'
        },
        {
          name: '现实主义风格',
          value: '现实主义风格',
          icon: '🎨',
          description: '写实细腻风格'
        },
        {
          name: '大眼风格',
          value: '大眼风格',
          icon: '👁️',
          description: '经典大眼动漫风格'
        }
      ]
    }
  },
  computed: {
    currentDisplayImage() {
      return this.animeImage || this.originalImage
    }
  },
  mounted() {
    this.generateStars()
  },
  methods: {
    generateStars() {
      this.stars = []
      // 增加星星数量到50个，并确保均匀分布
      for (let i = 0; i < 50; i++) {
        this.stars.push({
          x: Math.random() * 100,
          y: Math.random() * 100,
          delay: Math.random() * 3,
          size: 0.8 + Math.random() * 0.6 // 随机大小 0.8-1.4
        })
      }
    },

    triggerFileUpload() {
      console.log('触发文件上传，fileInput:', this.$refs.fileInput)
      if (this.$refs.fileInput) {
        this.$refs.fileInput.click()
      } else {
        console.error('fileInput ref 不存在')
      }
    },

    handleFileSelect(event) {
      const file = event.target.files[0]
      if (file) {
        this.processFile(file)
      }
    },

    handleFileDrop(event) {
      const files = event.dataTransfer.files
      if (files.length > 0) {
        this.processFile(files[0])
      }
    },

    processFile(file) {
      console.log('处理文件:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      })

      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!file.type || !allowedTypes.includes(file.type.toLowerCase())) {
        alert('请选择支持的图片格式（JPG、PNG、GIF、WebP）！')
        return
      }

      // 验证文件大小（5MB限制）
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        alert(`图片文件不能超过5MB！当前文件大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
        return
      }

      // 验证文件最小大小
      if (file.size < 1024) { // 小于1KB可能不是有效图片
        alert('文件太小，可能不是有效的图片文件！')
        return
      }

      console.log('文件验证通过，开始读取...')

      // 显示原图预览
      const reader = new FileReader()
      
      reader.onload = (e) => {
        console.log('文件读取成功，开始预览')
        // 重置所有状态
        this.originalImage = e.target.result
        this.currentFile = file
        this.animeImage = null
        this.isProcessed = false
        this.isProcessing = false
      }
      
      reader.onerror = (e) => {
        console.error('文件读取失败:', e)
        alert('文件读取失败，请重新选择！')
      }
      
      reader.readAsDataURL(file)
    },

    async startProcessing() {
      if (!this.currentFile || this.isProcessing) return

      try {
        this.isProcessing = true
        
        console.log('开始动漫化处理...', {
          fileName: this.currentFile.name,
          fileSize: this.currentFile.size,
          fileType: this.currentFile.type,
          selectedStyle: this.selectedStyle
        })

        // 创建 FormData
        const formData = new FormData()
        formData.append('image', this.currentFile)
        formData.append('style', this.selectedStyle)

        // 调用API
        console.log('正在调用 animateImage API...')
        const response = await animateImage(formData)
        
        console.log('API 响应类型:', typeof response)
        console.log('API 响应:', response)
        
        // 处理各种可能的响应格式
        if (response) {
          let resultUrl = null

          // 检查标准响应格式
          if (response.code === 200 && response.data && response.data.anime_url) {
            resultUrl = response.data.anime_url
          }
          // 检查直接返回URL的情况
          else if (typeof response === 'string' && response.startsWith('http')) {
            resultUrl = response
          }
          // 检查包含URL字段的情况
          else if (response.anime_url) {
            resultUrl = response.anime_url
          }
          else if (response.url) {
            resultUrl = response.url
          }
          else if (response.image_url) {
            resultUrl = response.image_url
          }
          // 检查是否是二进制数据（ArrayBuffer 或 Blob）
          else if (response instanceof ArrayBuffer || response instanceof Blob) {
            console.log('检测到二进制数据，创建 Blob URL')
            const blob = response instanceof Blob ? response : new Blob([response], { type: 'image/png' })
            resultUrl = URL.createObjectURL(blob)
            console.log('创建的 Blob URL:', resultUrl)
          }
          // 检查是否可能是 base64 编码的图片数据
          else if (typeof response === 'string' && response.length > 1000) {
            console.log('检测到可能的图片数据字符串，尝试创建 data URL')
            // 如果不是以 data: 开头，假设是 base64 编码的 PNG
            if (!response.startsWith('data:')) {
              resultUrl = 'data:image/png;base64,' + response
            } else {
              resultUrl = response
            }
            console.log('创建的 data URL 前缀:', resultUrl.substring(0, 50) + '...')
          }
          else {
            console.error('未知响应格式:', response)
            console.error('响应类型:', typeof response)
            console.error('响应构造函数:', response.constructor.name)
            const errorMsg = response.message || response.error || '服务器返回了未知格式的数据'
            throw new Error(errorMsg)
          }

          if (resultUrl) {
            this.animeImage = resultUrl
            this.isProcessed = true
            console.log('动漫化处理成功，图片URL:', resultUrl.substring(0, 100) + '...')
          } else {
            throw new Error('未获取到处理结果')
          }
        } else {
          throw new Error('服务器未返回任何数据')
        }
      } catch (error) {
        console.error('动漫化处理失败:', error)
        
        // 更详细的错误处理
        let errorMessage = '处理失败'
        
        if (error.message.includes('timeout') || error.message.includes('超时')) {
          errorMessage = '处理超时，请稍后重试'
        } else if (error.message.includes('Network') || error.message.includes('网络')) {
          errorMessage = '网络连接失败，请检查网络连接'
        } else if (error.message.includes('500')) {
          errorMessage = '服务器内部错误，请稍后重试'
        } else if (error.message.includes('413')) {
          errorMessage = '文件太大，请选择较小的图片'
        } else if (error.message.includes('415')) {
          errorMessage = '不支持的文件格式'
        } else if (error.message.includes('无法连接到服务器')) {
          errorMessage = '后端服务未运行，已启用开发模式的模拟处理'
        } else if (error.message.includes('模拟')) {
          errorMessage = error.message
        } else {
          errorMessage = error.message || '未知错误，请重试'
        }
        
        alert(`处理失败: ${errorMessage}`)
      } finally {
        this.isProcessing = false
      }
    },

    reuploadImage() {
      // 如果正在处理中，不执行任何操作
      if (this.isProcessing) {
        console.log('正在处理中，无法重新上传')
        return
      }

      console.log('重新上传图片被点击')
      
      // 清空文件输入
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = ''
        console.log('已清空文件输入')
      }
      
      // 使用 nextTick 确保DOM更新后再触发文件选择
      this.$nextTick(() => {
        console.log('nextTick 中触发文件上传')
        this.triggerFileUpload()
      })
    },

    selectStyle(style) {
      if (!this.isProcessing) {
        this.selectedStyle = style
        console.log('选择风格:', style)
      }
    },

    async downloadAnimeImage() {
      if (!this.animeImage) return
      
      try {
        console.log('开始下载动漫化图片:', this.animeImage)
        
        let blob
        
        // 如果是 Blob URL
        if (this.animeImage.startsWith('blob:')) {
          const response = await fetch(this.animeImage)
          blob = await response.blob()
        }
        // 如果是 data URL
        else if (this.animeImage.startsWith('data:')) {
          const response = await fetch(this.animeImage)
          blob = await response.blob()
        }
        // 如果是 HTTP URL
        else {
          const response = await fetch(this.animeImage)
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          blob = await response.blob()
        }
        
        // 创建下载链接
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        // 生成文件名
        const timestamp = new Date().getTime()
        link.download = `anime_image_${timestamp}.png`
        
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // 清理 URL
        setTimeout(() => {
          URL.revokeObjectURL(url)
        }, 1000)
        
        console.log('下载完成')
        
      } catch (error) {
        console.error('下载失败:', error)
        alert(`下载失败: ${error.message}`)
      }
    }
  }
}
</script>

<style scoped>
.anime-image {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* 上传区域样式 */
.upload-section {
  width: 100%;
  max-width: 600px;
}

.upload-container {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.upload-area {
  border: 3px dashed #e2e8f0;
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafbfc;
}

.upload-area:hover {
  border-color: #667eea;
  background: #f8faff;
  transform: translateY(-2px);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.upload-area h3 {
  color: #2d3748;
  margin-bottom: 10px;
  font-size: 24px;
  font-weight: 600;
}

.upload-area p {
  color: #718096;
  margin-bottom: 8px;
  font-size: 16px;
}

.upload-hint {
  font-size: 14px !important;
  color: #a0aec0 !important;
  margin-bottom: 30px !important;
}

.upload-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.upload-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
}

/* 图片展示布局 */
.image-display-layout {
  width: 100%;
  height: 100%;
  position: relative;
}

.center-content {
  width: 100%;
  height: 100%;
  padding-right: 300px; /* 为右侧边栏留出空间 */
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-container {
  background: transparent;
  border-radius: 0;
  padding: 0 0 30px 0;
  box-shadow: none;
  margin-bottom: 30px;
}

.image-container h3 {
  color: #2d3748;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 600;
}

.image-wrapper {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  display: inline-block;
  max-width: 100%;
}

.image-wrapper img {
  width: 100%;
  height: auto;
  max-height: 700px;
  object-fit: contain;
  display: block;
  border-radius: 12px;
  transition: filter 0.3s ease;
}

.image-wrapper img.processing {
  filter: brightness(0.7) contrast(1.1);
}

/* 处理中的覆盖层 */
.processing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.processing-stars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.processing-star {
  position: absolute;
  font-size: 24px;
  animation: twinkle 1.5s ease-in-out infinite;
  transform: translate(-50%, -50%);
}

.processing-text {
  color: white;
  text-align: center;
  z-index: 10;
}

.processing-text h4 {
  font-size: 20px;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.processing-text p {
  font-size: 14px;
  opacity: 0.9;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* 下载按钮样式 */
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
  z-index: 10;
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

.download-icon {
  font-size: 22px;
  color: white;
  font-weight: bold;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.process-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.process-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
}

.process-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.reupload-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(240, 147, 251, 0.3);
}

.reupload-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(240, 147, 251, 0.4);
}

.reupload-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.button-icon {
  font-size: 18px;
}

/* 风格选择边栏 */
.style-sidebar {
  position: fixed;
  right: 20px;
  top: 100px; /* 留出导航栏空间 */
  bottom: 20px;
  width: 280px;
  background: transparent;
  padding: 0;
  overflow-y: auto;
  z-index: 1000;
}


.style-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.style-option {
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.style-option:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
}

.style-option.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.style-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.style-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.style-description {
  font-size: 12px;
  opacity: 0.8;
}

.style-option.selected .style-description {
  opacity: 0.9;
}

/* 动画关键帧 */
@keyframes twinkle {
  0%, 100% { 
    opacity: 0.3; 
    transform: translate(-50%, -50%) scale(0.8); 
  }
  50% { 
    opacity: 1; 
    transform: translate(-50%, -50%) scale(1.2); 
  }
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .center-content {
    padding-right: 250px; /* 缩小右侧边栏空间 */
  }
  
  .style-sidebar {
    width: 240px;
  }
}

@media (max-width: 1200px) {
  .center-content {
    padding-right: 0; /* 移除右侧边栏空间 */
  }
  
  .style-sidebar {
    position: fixed;
    left: 50%;
    top: auto;
    bottom: 20px;
    right: auto;
    transform: translateX(-50%);
    width: calc(100vw - 40px);
    max-width: 800px;
    height: 200px;
    background: white;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  }
  
  .style-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 8px;
    height: 100%;
    overflow-y: auto;
  }
  
  .style-option {
    padding: 12px;
  }
}

@media (max-width: 768px) {
  .anime-image {
    padding: 20px;
  }
  
  .upload-container {
    padding: 30px 20px;
  }
  
  .image-container {
    padding: 30px 20px;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .style-sidebar {
    width: calc(100vw - 40px);
    background: white;
    border-radius: 20px;
    padding: 15px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  }
  
  .style-options {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
  
  .style-option {
    padding: 10px;
  }
  
  .style-name {
    font-size: 14px;
  }
  
  .style-description {
    font-size: 11px;
  }
}
</style>