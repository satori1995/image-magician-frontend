<template>
  <div class="text-to-speech" contenteditable="false">
    <!-- 输入区域 -->
    <div class="input-section">
      <div class="input-container">
        <h2 class="section-title">文本转语音</h2>
        <div class="text-input-wrapper">
          <textarea 
            v-model="inputText"
            class="text-input"
            placeholder="请输入要转换为语音的文本..."
            rows="15"
            maxlength="500"
          ></textarea>
          <div class="char-counter">{{ inputText.length }}/500</div>
        </div>
        
        
        <button 
          class="generate-button"
          @click="generateSpeech"
          :disabled="isGenerating || !inputText.trim() || !selectedVoiceModel"
        >
          {{ isGenerating ? '生成中...' : '生成语音' }}
        </button>
      </div>
    </div>

    <!-- 音频播放区域 -->
    <div v-if="audioData && audioData.url" class="audio-section">
      <div class="audio-container">
        <div class="audio-player">
          <audio 
            ref="audioPlayer"
            :src="audioData.url" 
            class="audio-controls"
            @loadedmetadata="onAudioLoaded"
            @timeupdate="onTimeUpdate"
            @ended="onAudioEnded"
            style="display: none;"
          ></audio>
          
          <!-- 自定义播放控件 -->
          <div class="custom-controls">
            <!-- 模型信息区域 -->
            <div class="model-info-section">
              <div class="model-avatar">
                <img :src="getModelAvatar(selectedVoiceModel)" :alt="selectedVoiceModel ? selectedVoiceModel.voice_name : ''" class="model-avatar-image" />
              </div>
              <div class="model-details">
                <div class="model-name">{{ selectedVoiceModel ? selectedVoiceModel.voice_name.toUpperCase() : '未选择模型' }}</div>
              </div>
            </div>
            
            <!-- 播放控制区域 -->
            <div class="playback-controls">
              <button 
                class="control-btn play-btn"
                @click="togglePlay"
                :class="{ playing: isPlaying }"
              >
                <svg v-if="!isPlaying" class="play-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <svg v-else class="pause-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              </button>
              
              <div class="progress-container">
                <div class="time-display">{{ formatTime(currentTime) }}</div>
                <div 
                  class="progress-bar" 
                  :class="{ dragging: isDragging }"
                  @click="seekTo"
                  @mousedown="startDrag"
                  @mousemove="onDrag"
                  @mouseup="endDrag"
                  @mouseleave="endDrag"
                  ref="progressBar"
                >
                  <div 
                    class="progress-fill" 
                    :style="{ width: progressPercent + '%' }"
                  ></div>
                  <div 
                    class="progress-thumb" 
                    :style="{ left: progressPercent + '%' }"
                    :class="{ dragging: isDragging }"
                  ></div>
                </div>
                <div class="time-display">{{ formatTime(duration) }}</div>
              </div>
              
              <button class="control-btn download-btn" @click="downloadAudio">
                <svg class="download-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                <span>下载</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isGenerating" class="loading-indicator">
      <div class="loading-animation">
        <div class="sound-waves">
          <div class="wave"></div>
          <div class="wave"></div>
          <div class="wave"></div>
          <div class="wave"></div>
          <div class="wave"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TextToSpeech',
  props: {
    selectedVoiceModel: {
      type: Object,
      default: null
    },
    ttsParams: {
      type: Object,
      default: () => ({})
    },
    audioData: {
      type: Object,
      default: null
    },
    isGenerating: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      inputText: '',
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      progressPercent: 0,
      isDragging: false,
      dragStartX: 0,
      dragStartPercent: 0
    }
  },
  methods: {
    async generateSpeech() {
      if (!this.inputText.trim() || !this.selectedVoiceModel) {
        return
      }
      
      // 发送生成事件给父组件
      this.$emit('generate-speech', this.inputText)
    },
    
    async togglePlay() {
      const audio = this.$refs.audioPlayer
      if (!audio) return
      
      try {
        if (this.isPlaying) {
          audio.pause()
        } else {
          await audio.play()
        }
      } catch (error) {
        console.error('播放失败:', error)
        this.isPlaying = false
      }
    },
    
    onAudioLoaded() {
      const audio = this.$refs.audioPlayer
      if (audio) {
        this.duration = audio.duration
      }
    },
    
    onTimeUpdate() {
      if (this.isDragging) return // 拖动时不更新进度
      
      const audio = this.$refs.audioPlayer
      if (audio) {
        this.currentTime = audio.currentTime
        this.progressPercent = (this.currentTime / this.duration) * 100
      }
    },
    
    onAudioEnded() {
      this.isPlaying = false
    },
    
    seekTo(event) {
      if (this.isDragging) return
      
      const audio = this.$refs.audioPlayer
      if (!audio) return
      
      const progressBar = event.currentTarget
      const rect = progressBar.getBoundingClientRect()
      const clickX = event.clientX - rect.left
      const percent = Math.max(0, Math.min(1, clickX / rect.width))
      const newTime = percent * this.duration
      
      audio.currentTime = newTime
      this.currentTime = newTime
      this.progressPercent = percent * 100
    },
    
    startDrag(event) {
      event.preventDefault()
      this.isDragging = true
      this.dragStartX = event.clientX
      this.dragStartPercent = this.progressPercent
      
      // 添加全局事件监听器
      document.addEventListener('mousemove', this.onGlobalDrag)
      document.addEventListener('mouseup', this.onGlobalDragEnd)
    },
    
    onDrag(event) {
      if (!this.isDragging) return
      event.preventDefault()
    },
    
    onGlobalDrag(event) {
      if (!this.isDragging) return
      
      const progressBar = this.$refs.progressBar
      if (!progressBar) return
      
      const rect = progressBar.getBoundingClientRect()
      const currentX = event.clientX
      const percent = Math.max(0, Math.min(1, (currentX - rect.left) / rect.width))
      
      this.progressPercent = percent * 100
      this.currentTime = percent * this.duration
    },
    
    endDrag() {
      if (!this.isDragging) return
      
      this.isDragging = false
      
      // 移除全局事件监听器
      document.removeEventListener('mousemove', this.onGlobalDrag)
      document.removeEventListener('mouseup', this.onGlobalDragEnd)
      
      // 设置音频播放位置
      const audio = this.$refs.audioPlayer
      if (audio) {
        audio.currentTime = this.currentTime
      }
    },
    
    onGlobalDragEnd() {
      this.endDrag()
    },
    
    formatTime(seconds) {
      if (isNaN(seconds) || seconds === 0) return '0:00'
      
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    },
    
    downloadAudio() {
      if (!this.audioData || !this.audioData.url) return
      
      const link = document.createElement('a')
      link.href = this.audioData.url
      const format = this.audioData.extraInfo ? this.audioData.extraInfo.audio_format : 'mp3'
      link.download = `speech_${Date.now()}.${format}`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    
    formatDuration(milliseconds) {
      const seconds = Math.floor(milliseconds / 1000)
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    },
    
    formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    },
    
    getModelAvatar(model) {
      if (!model) return this.generateLetterAvatar('未选择')
      
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
    },
    
    bindAudioEvents() {
      const audio = this.$refs.audioPlayer
      if (audio && !audio._eventsBinding) {
        // 标记已绑定事件，避免重复绑定
        audio._eventsBinding = true
        
        audio.addEventListener('play', () => {
          this.isPlaying = true
        })
        
        audio.addEventListener('pause', () => {
          this.isPlaying = false
        })
        
        audio.addEventListener('ended', () => {
          this.isPlaying = false
        })
      }
    }
  },
  
  mounted() {
    // 监听音频播放状态会在 onAudioLoaded 中设置
  },
  
  watch: {
    // 监听 audioData 变化，当音频加载时绑定事件
    audioData: {
      handler(newVal) {
        if (newVal && newVal.url) {
          this.$nextTick(() => {
            this.bindAudioEvents()
          })
        }
      },
      immediate: true
    }
  }
}
</script>

<style scoped>
.text-to-speech {
  height: 100%;
  display: flex;
  flex-direction: column;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* 输入区域 */
.input-section {
  padding: 40px 30px;
}

.input-container {
  max-width: 1000px;
  margin: 0 auto;
}

.section-title {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 30px;
  text-align: center;
}

.text-input-wrapper {
  position: relative;
  margin-bottom: 30px;
}

.text-input {
  width: 100%;
  padding: 25px;
  border: none;
  border-radius: 15px;
  font-size: 16px;
  line-height: 1.6;
  resize: none;
  min-height: 350px;
  height: 350px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  color: #333;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
}

.text-input:focus {
  outline: none;
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.text-input::placeholder {
  color: #8a9ba8;
}

.char-counter {
  position: absolute;
  bottom: 10px;
  right: 15px;
  font-size: 12px;
  color: #6c757d;
  background: rgba(255, 255, 255, 0.8);
  padding: 4px 8px;
  border-radius: 4px;
}


/* 生成按钮 */
.generate-button {
  display: block;
  width: 200px;
  margin: 0 auto;
  padding: 18px 35px;
  background: linear-gradient(135deg, #53bcea 0%, #1bb16e 100%);
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.4s ease;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.generate-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, #6ce3da 0%, #bf6fed 100%);
}

.generate-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.generate-button:hover::before {
  left: 100%;
}

.generate-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 音频播放区域 */
.audio-section {
  padding: 20px 30px;
}

.audio-container {
  max-width: 1000px;
  margin: 0 auto;
}


.audio-controls {
  width: 100%;
  margin-bottom: 20px;
  border-radius: 8px;
}

/* 自定义播放控件 */
.custom-controls {
  display: flex;
  flex-direction: column;
  gap: 25px;
  padding: 30px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%);
  border-radius: 24px;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.12),
    0 1px 0 rgba(255, 255, 255, 0.8),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  position: relative;
}

.custom-controls::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.02) 100%);
  border-radius: 24px;
  pointer-events: none;
}

/* 模型信息区域 */
.model-info-section {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.06) 0%, rgba(118, 75, 162, 0.04) 100%);
  border-radius: 18px;
  border: 1px solid rgba(102, 126, 234, 0.12);
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.model-info-section:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.06) 100%);
  border-color: rgba(102, 126, 234, 0.18);
  transform: translateY(-1px);
}

.model-avatar {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
}

.model-avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(102, 126, 234, 0.3);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  transition: all 0.3s ease;
}

.model-avatar-image:hover {
  transform: scale(1.05);
  border-color: rgba(102, 126, 234, 0.5);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}

.model-details {
  flex: 1;
}

.model-name {
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
  margin: 0;
}

/* 播放控制区域 */
.playback-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  z-index: 1;
}

.control-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  color: #667eea;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.control-btn:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
}

.play-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  color: white;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.35);
  position: relative;
  overflow: hidden;
}

.play-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.play-btn:hover::before {
  opacity: 1;
}

.play-icon, .pause-icon {
  width: 24px;
  height: 24px;
  transition: transform 0.2s ease;
}

.play-btn:active .play-icon,
.play-btn:active .pause-icon {
  transform: scale(0.9);
}

.download-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
}

.download-icon {
  width: 18px;
  height: 18px;
  transition: transform 0.2s ease;
}

.download-btn:hover .download-icon {
  transform: translateY(2px);
}

.play-btn:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 50%, #ec4899 100%);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
}

.play-btn.playing {
  background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
  }
  50% {
    box-shadow: 0 8px 30px rgba(16, 185, 129, 0.5);
  }
}

.progress-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 0 10px;
}

.time-display {
  font-size: 13px;
  color: #6b7280;
  font-weight: 600;
  min-width: 45px;
  text-align: center;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.1) 100%);
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.progress-bar:hover {
  transform: scaleY(1.2);
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.15);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  border-radius: 10px;
  transition: width 0.1s ease;
  position: relative;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.progress-thumb {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 3px 12px rgba(102, 126, 234, 0.4);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  z-index: 2;
}

.progress-bar:hover .progress-thumb {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.1);
}

.progress-thumb.dragging {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.3);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.6);
  cursor: grabbing;
}

.progress-bar.dragging {
  cursor: grabbing;
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
  margin-bottom: 40px;
}

.sound-waves {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
}

.wave {
  width: 6px;
  height: 40px;
  background: linear-gradient(to top, #667eea, #764ba2);
  border-radius: 3px;
  animation: soundWave 1.2s ease-in-out infinite;
}

.wave:nth-child(1) { animation-delay: -0.8s; }
.wave:nth-child(2) { animation-delay: -0.6s; }
.wave:nth-child(3) { animation-delay: -0.4s; }
.wave:nth-child(4) { animation-delay: -0.2s; }
.wave:nth-child(5) { animation-delay: 0s; }


@keyframes soundWave {
  0%, 40%, 100% {
    transform: scaleY(0.4);
    opacity: 0.6;
  }
  20% {
    transform: scaleY(1);
    opacity: 1;
  }
}

/* 响应式布局 */
@media (max-width: 768px) {
  .custom-controls {
    flex-direction: column;
    gap: 10px;
  }
  
  .progress-container {
    width: 100%;
    order: -1;
  }
}
</style>