<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <h3 class="modal-title">选择音色模型</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      
      <div class="modal-body">
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>正在加载模型...</p>
        </div>
        
        <div v-else-if="error" class="error-container">
          <p class="error-message">{{ error }}</p>
          <button class="retry-btn" @click="fetchVoiceModels">重试</button>
        </div>
        
        <div v-else class="models-container">
          <!-- 导航标签 -->
          <div class="model-tabs">
            <button 
              class="tab-btn"
              :class="{ active: activeTab === 'builtin' }"
              @click="switchTab('builtin')"
            >
              内置模型
            </button>
            <button 
              class="tab-btn"
              :class="{ active: activeTab === 'custom' }"
              @click="switchTab('custom')"
            >
              自定义模型
            </button>
          </div>
          
          <!-- 模型列表 -->
          <div class="model-section">
            <ul class="model-list">
              <li 
                v-for="model in paginatedModels" 
                :key="model.voice_id"
                class="model-item"
                @click="selectModel(model)"
              >
                <div class="model-card">
                  <div class="model-avatar">
                    <img :src="getModelAvatar(model)" :alt="model.voice_name" class="avatar-image" />
                  </div>
                  <div class="model-info">
                    <div class="model-name">{{ model.voice_name }}</div>
                    <div 
                      class="model-description" 
                      :title="model.description"
                      v-html="truncateDescription(model.description)"
                    ></div>
                  </div>
                  <div class="action-buttons">
                    <button 
                      class="preview-btn" 
                      :class="{ playing: previewingVoiceId === model.voice_id }"
                      @click.stop="previewModel(model)"
                    >
                      <span class="btn-text">{{ previewingVoiceId === model.voice_id ? '停止' : '试听' }}</span>
                      <div class="btn-glow"></div>
                    </button>
                    <button class="select-btn">
                      <span class="btn-text">选择</span>
                      <div class="btn-glow"></div>
                    </button>
                  </div>
                </div>
                <div class="model-overlay"></div>
              </li>
            </ul>
            
            <!-- 分页控件 -->
            <div v-if="totalPages > 1" class="pagination">
              <button 
                class="page-btn"
                :disabled="currentPage === 1"
                @click="changePage(currentPage - 1)"
              >
                上一页
              </button>
              <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
              <button 
                class="page-btn"
                :disabled="currentPage === totalPages"
                @click="changePage(currentPage + 1)"
              >
                下一页
              </button>
            </div>
          </div>
          
          <!-- 无模型提示 -->
          <div v-if="currentModels.length === 0" class="no-models">
            <p>暂无可用的{{ activeTab === 'builtin' ? '内置' : '自定义' }}模型</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getVoiceModels, audioPreview } from '../services/api.js'

export default {
  name: 'VoiceModelSelector',
  data() {
    return {
      loading: false,
      error: null,
      voiceModels: {
        builtin_voice_models: [],
        custom_voice_models: []
      },
      activeTab: 'builtin',
      currentPage: 1,
      pageSize: 10,
      previewingVoiceId: null,
      previewAudio: null
    }
  },
  mounted() {
    this.fetchVoiceModels()
  },
  methods: {
    async fetchVoiceModels() {
      this.loading = true
      this.error = null
      
      try {
        const response = await getVoiceModels()
        if (response.code === 200 && response.data) {
          this.voiceModels = response.data
        } else {
          throw new Error('获取模型数据格式错误')
        }
      } catch (error) {
        console.error('获取语音模型失败:', error)
        this.error = error.message || '获取语音模型失败，请稍后重试'
      } finally {
        this.loading = false
      }
    },
    
    switchTab(tab) {
      this.activeTab = tab
      this.currentPage = 1
    },
    
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
      }
    },
    
    truncateDescription(description, maxLength = 60) {
      if (!description) return ''
      if (description.length <= maxLength) return description
      return description.substring(0, maxLength) + '...'
    },
    
    selectModel(model) {
      this.$emit('select', model)
    },
    
    async previewModel(model) {
      try {
        // 如果正在试听同一个模型，则停止播放
        if (this.previewingVoiceId === model.voice_id) {
          this.stopPreview()
          return
        }
        
        // 停止当前播放的预览
        this.stopPreview()
        
        // 设置正在试听的模型
        this.previewingVoiceId = model.voice_id
        
        console.log('试听模型:', model)
        
        // 发送预览请求
        const response = await audioPreview(model.voice_id)
        
        if (response.code === 200 && response.data && response.data.audio) {
          // 将16进制音频数据转换为可播放的格式
          const audioBlob = this.hexToAudioBlob(response.data.audio)
          const audioUrl = URL.createObjectURL(audioBlob)
          
          // 创建音频元素并播放
          this.previewAudio = new Audio(audioUrl)
          this.previewAudio.addEventListener('ended', () => {
            this.previewingVoiceId = null
            this.cleanupPreviewAudio()
          })
          
          this.previewAudio.addEventListener('error', (error) => {
            console.error('音频播放失败:', error)
            this.previewingVoiceId = null
            this.cleanupPreviewAudio()
          })
          
          await this.previewAudio.play()
        }
      } catch (error) {
        console.error('试听失败:', error)
        this.previewingVoiceId = null
        this.cleanupPreviewAudio()
      }
    },
    
    stopPreview() {
      if (this.previewAudio) {
        this.previewAudio.pause()
        this.previewAudio.currentTime = 0
        this.cleanupPreviewAudio()
      }
      this.previewingVoiceId = null
    },
    
    cleanupPreviewAudio() {
      if (this.previewAudio) {
        if (this.previewAudio.src) {
          URL.revokeObjectURL(this.previewAudio.src)
        }
        this.previewAudio = null
      }
    },
    
    hexToAudioBlob(hexString) {
      // 将16进制字符串转换为字节数组
      const bytes = []
      for (let i = 0; i < hexString.length; i += 2) {
        bytes.push(parseInt(hexString.substr(i, 2), 16))
      }
      
      // 创建Uint8Array
      const uint8Array = new Uint8Array(bytes)
      
      // 创建Blob (默认为MP3格式)
      return new Blob([uint8Array], { type: 'audio/mpeg' })
    },
    
    getModelAvatar(model) {
      // 对于自定义模型，优先使用 b64_photo 字段
      if (model.b64_photo) {
        return model.b64_photo
      }
      
      // 对于内置模型，根据名称首字母生成头像
      return this.generateLetterAvatar(model.voice_name)
    },
    
    generateLetterAvatar(name) {
      const firstLetter = name.charAt(0).toUpperCase()
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
        '#FF9F43', '#A29BFE', '#6C5CE7', '#FD79A8', '#FDCB6E'
      ]
      
      // 根据字母生成颜色
      const colorIndex = firstLetter.charCodeAt(0) - 65
      const bgColor = colors[colorIndex % colors.length]
      
      // 创建 SVG 图像
      const svg = `
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${this.darkenColor(bgColor, 20)};stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="50" fill="url(#grad)" />
          <text x="50" y="65" font-family="Arial, sans-serif" font-size="40" font-weight="bold" 
                text-anchor="middle" fill="white" text-shadow="0 2px 4px rgba(0,0,0,0.3)">${firstLetter}</text>
        </svg>
      `
      
      return `data:image/svg+xml;base64,${btoa(svg)}`
    },
    
    darkenColor(color, percent) {
      const num = parseInt(color.replace('#', ''), 16)
      const amt = Math.round(2.55 * percent)
      const R = (num >> 16) - amt
      const G = (num >> 8 & 0x00FF) - amt
      const B = (num & 0x0000FF) - amt
      return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1)
    }
  },
  
  computed: {
    currentModels() {
      return this.activeTab === 'builtin' 
        ? this.voiceModels.builtin_voice_models || []
        : this.voiceModels.custom_voice_models || []
    },
    
    totalPages() {
      return Math.ceil(this.currentModels.length / this.pageSize)
    },
    
    paginatedModels() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.currentModels.slice(start, end)
    }
  },
  
  beforeDestroy() {
    // 清理试听音频
    this.stopPreview()
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 96%;
  max-width: 900px;
  max-height: 85vh;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2dfd8;
  background: #f8f9fa;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
  font-size: 20px;
  color: #666;
  line-height: 1;
}

.close-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}


.modal-body {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  text-align: center;
  padding: 40px 20px;
}

.error-message {
  color: #e74c3c;
  margin-bottom: 16px;
  font-size: 16px;
}

.retry-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.retry-btn:hover {
  background: #2980b9;
}

.models-container {
  max-height: 500px;
  overflow-y: auto;
}

.model-tabs {
  display: flex;
  margin-bottom: 20px;
  margin: 0 12px 20px 12px;
}

.tab-btn {
  flex: 1;
  padding: 12px 20px;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 600;
  color: #7f8c8d;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  color: #3498db;
  background-color: rgba(52, 152, 219, 0.05);
}

.tab-btn.active {
  color: #3498db;
  background-color: rgba(52, 152, 219, 0.1);
}

.model-section {
  margin-bottom: 20px;
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  list-style: none;
  padding: 0 12px;
  margin: 0;
}

.model-item {
  position: relative;
  cursor: pointer;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 50%, #f0f4ff 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
}

.model-item:hover {
  transform: translateY(-3px) scale(1.01);
  box-shadow: 
    0 8px 20px rgba(52, 152, 219, 0.25),
    0 0 0 2px rgba(52, 152, 219, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.model-item:hover .model-overlay {
  opacity: 1;
}


.model-item:hover .btn-glow {
  opacity: 1;
}

.model-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  position: relative;
  z-index: 2;
}

.model-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
}

.model-avatar {
  width: 50px;
  height: 50px;
  margin-right: 15px;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(52, 152, 219, 0.2);
  transition: all 0.3s ease;
}

.model-item:hover .avatar-image {
  border-color: rgba(52, 152, 219, 0.5);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.model-info {
  flex: 1;
  margin-right: 20px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

.model-name {
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.model-description {
  font-size: 13px;
  color: #6c7b8a;
  line-height: 1.5;
  font-weight: 400;
  opacity: 0.8;
}

.select-btn, .preview-btn {
  position: relative;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 60px;
  overflow: hidden;
}

.select-btn {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.2);
}

.preview-btn {
  background: linear-gradient(135deg, #27ae60 0%, #219a52 100%);
  box-shadow: 0 4px 15px rgba(39, 174, 96, 0.2);
}

.btn-text {
  position: relative;
  z-index: 2;
  letter-spacing: 0.5px;
}

.btn-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
}

.select-btn:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
  transform: scale(1.08);
}

.preview-btn:hover {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%) !important;
  box-shadow: 0 6px 20px rgba(46, 204, 113, 0.5);
  transform: scale(1.08);
}

.preview-btn.playing {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%) !important;
  animation: pulse 1.5s infinite;
}

.preview-btn.playing:hover {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%) !important;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.2);
  }
  50% {
    box-shadow: 0 6px 25px rgba(231, 76, 60, 0.4);
  }
}

.select-btn:active, .preview-btn:active {
  transform: scale(0.95);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e2dfd8;
}

.page-btn {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
}

.page-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
}

.page-info {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 500;
  min-width: 60px;
  text-align: center;
}

.no-models {
  text-align: center;
  padding: 40px 20px;
  color: #7f8c8d;
  font-size: 16px;
}

/* 滚动条样式 */
.modal-body::-webkit-scrollbar,
.models-container::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track,
.models-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb,
.models-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb:hover,
.models-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>