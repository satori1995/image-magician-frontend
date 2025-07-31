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
            rows="6"
            maxlength="5000"
          ></textarea>
          <div class="char-counter">{{ inputText.length }}/5000</div>
        </div>
        
        <!-- 语音设置 -->
        <div class="voice-settings">
          <div class="setting-group">
            <label class="setting-label">语音类型</label>
            <select v-model="selectedVoice" class="setting-select">
              <option value="female">女声</option>
              <option value="male">男声</option>
              <option value="child">童声</option>
            </select>
          </div>
          
          <div class="setting-group">
            <label class="setting-label">语速</label>
            <select v-model="speechRate" class="setting-select">
              <option value="slow">慢速</option>
              <option value="normal">正常</option>
              <option value="fast">快速</option>
            </select>
          </div>
        </div>
        
        <button 
          class="generate-button"
          @click="generateSpeech"
          :disabled="isGenerating || !inputText.trim()"
        >
          {{ isGenerating ? '生成中...' : '生成语音' }}
        </button>
      </div>
    </div>

    <!-- 音频播放区域 -->
    <div v-if="audioUrl" class="audio-section">
      <div class="audio-container">
        <h3 class="audio-title">生成的语音</h3>
        <div class="audio-player">
          <audio 
            ref="audioPlayer"
            :src="audioUrl" 
            controls
            class="audio-controls"
            @loadedmetadata="onAudioLoaded"
            @timeupdate="onTimeUpdate"
            @ended="onAudioEnded"
          ></audio>
          
          <!-- 自定义播放控件 -->
          <div class="custom-controls">
            <button 
              class="control-btn play-btn"
              @click="togglePlay"
              :class="{ playing: isPlaying }"
            >
              <span v-if="!isPlaying">▶️</span>
              <span v-else>⏸️</span>
            </button>
            
            <div class="progress-container">
              <div class="time-display">{{ formatTime(currentTime) }}</div>
              <div class="progress-bar" @click="seekTo">
                <div 
                  class="progress-fill" 
                  :style="{ width: progressPercent + '%' }"
                ></div>
              </div>
              <div class="time-display">{{ formatTime(duration) }}</div>
            </div>
            
            <button class="control-btn download-btn" @click="downloadAudio">
              ⬇️ 下载
            </button>
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
      <div class="loading-text">
        <h3>正在生成语音</h3>
        <p>请稍候，AI正在将您的文本转换为自然语音...</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TextToSpeech',
  data() {
    return {
      inputText: '',
      selectedVoice: 'female',
      speechRate: 'normal',
      isGenerating: false,
      audioUrl: '',
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      progressPercent: 0
    }
  },
  methods: {
    async generateSpeech() {
      if (!this.inputText.trim()) return
      
      this.isGenerating = true
      
      try {
        // TODO: 调用后端API生成语音
        console.log('生成语音参数:', {
          text: this.inputText,
          voice: this.selectedVoice,
          rate: this.speechRate
        })
        
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // 模拟返回音频URL
        this.audioUrl = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJiTkJhkBUWBShd+OdHNTuMeMg=='
        
      } catch (error) {
        console.error('语音生成失败:', error)
        alert('语音生成失败，请重试')
      } finally {
        this.isGenerating = false
      }
    },
    
    togglePlay() {
      const audio = this.$refs.audioPlayer
      if (!audio) return
      
      if (this.isPlaying) {
        audio.pause()
      } else {
        audio.play()
      }
    },
    
    onAudioLoaded() {
      const audio = this.$refs.audioPlayer
      if (audio) {
        this.duration = audio.duration
      }
    },
    
    onTimeUpdate() {
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
      const audio = this.$refs.audioPlayer
      if (!audio) return
      
      const progressBar = event.currentTarget
      const rect = progressBar.getBoundingClientRect()
      const clickX = event.clientX - rect.left
      const percent = clickX / rect.width
      const newTime = percent * this.duration
      
      audio.currentTime = newTime
    },
    
    formatTime(seconds) {
      if (isNaN(seconds) || seconds === 0) return '0:00'
      
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    },
    
    downloadAudio() {
      if (!this.audioUrl) return
      
      const link = document.createElement('a')
      link.href = this.audioUrl
      link.download = `speech_${Date.now()}.wav`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  },
  
  mounted() {
    // 监听音频播放状态
    if (this.$refs.audioPlayer) {
      this.$refs.audioPlayer.addEventListener('play', () => {
        this.isPlaying = true
      })
      this.$refs.audioPlayer.addEventListener('pause', () => {
        this.isPlaying = false
      })
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
  max-width: 800px;
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
  padding: 20px;
  border: none;
  border-radius: 15px;
  font-size: 16px;
  line-height: 1.6;
  resize: vertical;
  min-height: 150px;
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

/* 语音设置 */
.voice-settings {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  justify-content: center;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-label {
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.setting-select {
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  color: #495057;
  cursor: pointer;
  transition: all 0.3s ease;
}

.setting-select:focus {
  outline: none;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.2);
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
  padding: 30px;
  background: rgba(255, 255, 255, 0.5);
  margin: 20px 30px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.audio-container {
  max-width: 800px;
  margin: 0 auto;
}

.audio-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.audio-controls {
  width: 100%;
  margin-bottom: 20px;
  border-radius: 8px;
}

/* 自定义播放控件 */
.custom-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.control-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 600;
}

.control-btn:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-1px);
}

.play-btn {
  font-size: 16px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-btn.playing {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.progress-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.time-display {
  font-size: 12px;
  color: #6c757d;
  font-weight: 600;
  min-width: 40px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  cursor: pointer;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
  transition: width 0.1s ease;
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
  .voice-settings {
    flex-direction: column;
    align-items: center;
  }
  
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