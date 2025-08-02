<template>
  <div class="right-sidebar" :class="{ 'visible': isVisible }">
    <div class="sidebar-content">
      <!-- 音色选择模型 -->
      <div class="voice-model-section">
        <div class="voice-model-card" @click="openVoiceModelSelector">
          <div class="card-content">
            <div class="selected-model" v-if="selectedVoiceModel">
              <div class="selected-avatar">
                <img :src="getModelAvatar(selectedVoiceModel)" :alt="selectedVoiceModel.voice_name" class="selected-avatar-image" />
              </div>
              <div class="model-name">{{ selectedVoiceModel.voice_name.toUpperCase() }}</div>
            </div>
            <div class="placeholder-text" v-else>
              <span class="fancy-text">选择音色模型</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 语音参数控制 -->
      <div class="voice-params-section">
        <div class="section-header">
          <div class="section-title">语音参数</div>
          <button class="reset-icon" @click="resetVoiceParams" title="重置语音参数">↻</button>
        </div>
        
        <!-- 速度控制 -->
        <div class="param-group">
          <div class="param-header">
            <label class="param-label">速度</label>
            <div class="param-value">{{ ttsParams.speed }}</div>
          </div>
          <input 
            type="range" 
            v-model.number="ttsParams.speed"
            min="0.5" 
            max="2" 
            step="0.01"
            class="param-slider"
          />
        </div>
        
        <!-- 音量控制 -->
        <div class="param-group">
          <div class="param-header">
            <label class="param-label">音量</label>
            <div class="param-value">{{ ttsParams.vol }}</div>
          </div>
          <input 
            type="range" 
            v-model.number="ttsParams.vol"
            min="0.01" 
            max="10" 
            step="0.01"
            class="param-slider"
          />
        </div>
        
        <!-- 音高控制 -->
        <div class="param-group">
          <div class="param-header">
            <label class="param-label">音高</label>
            <div class="param-value">{{ ttsParams.pitch }}</div>
          </div>
          <input 
            type="range" 
            v-model.number="ttsParams.pitch"
            min="-12" 
            max="12" 
            step="1"
            class="param-slider"
          />
        </div>
        
        <!-- 情绪选择 -->
        <div class="param-group">
          <label class="param-label">情绪</label>
          <div class="custom-dropdown" @click="toggleEmotionDropdown" ref="emotionDropdown">
            <div class="dropdown-selected">
              <span class="selected-emotion-icon">{{ getEmotionIcon(ttsParams.emotion) }}</span>
              <span class="selected-emotion-text">{{ getEmotionLabel(ttsParams.emotion) }}</span>
              <svg class="dropdown-arrow" :class="{ open: showEmotionDropdown }" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </div>
            <div class="dropdown-menu" v-show="showEmotionDropdown">
              <div 
                v-for="emotion in emotionOptions" 
                :key="emotion.value"
                class="dropdown-item"
                :class="{ active: ttsParams.emotion === emotion.value }"
                @click.stop="selectEmotion(emotion.value)"
              >
                <span class="emotion-icon">{{ emotion.icon }}</span>
                <span class="emotion-label">{{ emotion.label }}</span>
                <svg v-if="ttsParams.emotion === emotion.value" class="check-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 音频参数设置 -->
      <div class="audio-params-section">
        <div class="section-header">
          <div class="section-title">音频参数</div>
          <button class="reset-icon" @click="resetAudioParams" title="重置音频参数">↻</button>
        </div>
        
        <div class="param-row">
          <!-- 采样率 -->
          <div class="param-group half-width">
            <label class="param-label">采样率</label>
            <div class="custom-dropdown" @click="toggleSampleRateDropdown" ref="sampleRateDropdown">
              <div class="dropdown-selected">
                <span class="selected-text">{{ getSampleRateLabel(ttsParams.sample_rate) }}</span>
                <svg class="dropdown-arrow" :class="{ open: showSampleRateDropdown }" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </div>
              <div class="dropdown-menu" v-show="showSampleRateDropdown">
                <div 
                  v-for="option in sampleRateOptions" 
                  :key="option.value"
                  class="dropdown-item"
                  :class="{ active: ttsParams.sample_rate === option.value }"
                  @click.stop="selectSampleRate(option.value)"
                >
                  <span class="option-label">{{ option.label }}</span>
                  <svg v-if="ttsParams.sample_rate === option.value" class="check-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 比特率 -->
          <div class="param-group half-width">
            <label class="param-label">比特率</label>
            <div class="custom-dropdown" @click="toggleBitrateDropdown" ref="bitrateDropdown">
              <div class="dropdown-selected">
                <span class="selected-text">{{ getBitrateLabel(ttsParams.bitrate) }}</span>
                <svg class="dropdown-arrow" :class="{ open: showBitrateDropdown }" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </div>
              <div class="dropdown-menu" v-show="showBitrateDropdown">
                <div 
                  v-for="option in bitrateOptions" 
                  :key="option.value"
                  class="dropdown-item"
                  :class="{ active: ttsParams.bitrate === option.value }"
                  @click.stop="selectBitrate(option.value)"
                >
                  <span class="option-label">{{ option.label }}</span>
                  <svg v-if="ttsParams.bitrate === option.value" class="check-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="param-row">
          <!-- 音频格式 -->
          <div class="param-group half-width">
            <label class="param-label">格式</label>
            <div class="custom-dropdown" @click="toggleFormatDropdown" ref="formatDropdown">
              <div class="dropdown-selected">
                <span class="selected-text">{{ getFormatLabel(ttsParams.format) }}</span>
                <svg class="dropdown-arrow" :class="{ open: showFormatDropdown }" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </div>
              <div class="dropdown-menu" v-show="showFormatDropdown">
                <div 
                  v-for="option in formatOptions" 
                  :key="option.value"
                  class="dropdown-item"
                  :class="{ active: ttsParams.format === option.value }"
                  @click.stop="selectFormat(option.value)"
                >
                  <span class="option-label">{{ option.label }}</span>
                  <svg v-if="ttsParams.format === option.value" class="check-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 通道数 -->
          <div class="param-group half-width">
            <label class="param-label">通道数</label>
            <div class="custom-dropdown" @click="toggleChannelDropdown" ref="channelDropdown">
              <div class="dropdown-selected">
                <span class="selected-text">{{ getChannelLabel(ttsParams.channel) }}</span>
                <svg class="dropdown-arrow" :class="{ open: showChannelDropdown }" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </div>
              <div class="dropdown-menu" v-show="showChannelDropdown">
                <div 
                  v-for="option in channelOptions" 
                  :key="option.value"
                  class="dropdown-item"
                  :class="{ active: ttsParams.channel === option.value }"
                  @click.stop="selectChannel(option.value)"
                >
                  <span class="option-label">{{ option.label }}</span>
                  <svg v-if="ttsParams.channel === option.value" class="check-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 音色模型选择弹窗 -->
    <VoiceModelSelector 
      v-if="showVoiceSelector"
      @close="closeVoiceModelSelector"
      @select="handleVoiceModelSelect"
    />
  </div>
</template>

<script>
import VoiceModelSelector from './VoiceModelSelector.vue'
import { textToVoice } from '../services/api.js'

export default {
  name: 'RightSidebar',
  components: {
    VoiceModelSelector
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      showVoiceSelector: false,
      selectedVoiceModel: null,
      showEmotionDropdown: false,
      showSampleRateDropdown: false,
      showBitrateDropdown: false,
      showFormatDropdown: false,
      showChannelDropdown: false,
      // 文本转语音参数
      ttsParams: {
        text: '',
        speed: 1.00,
        vol: 1.00,
        pitch: 0,
        emotion: 'auto',
        sample_rate: 32000,
        bitrate: 128000,
        format: 'mp3',
        channel: 1
      },
      emotionOptions: [
        { value: 'auto', label: '自动', icon: '🤖' },
        { value: 'happy', label: '开心', icon: '😊' },
        { value: 'sad', label: '悲伤', icon: '😢' },
        { value: 'angry', label: '愤怒', icon: '😠' },
        { value: 'fearful', label: '恐惧', icon: '😨' },
        { value: 'disgusted', label: '反感', icon: '🤢' },
        { value: 'surprised', label: '惊讶', icon: '😲' },
        { value: 'neutral', label: '中性', icon: '😐' }
      ],
      sampleRateOptions: [
        { value: 8000, label: '8kHz' },
        { value: 16000, label: '16kHz' },
        { value: 22050, label: '22kHz' },
        { value: 24000, label: '24kHz' },
        { value: 32000, label: '32kHz' },
        { value: 44100, label: '44kHz' }
      ],
      bitrateOptions: [
        { value: 32000, label: '32kbps' },
        { value: 64000, label: '64kbps' },
        { value: 128000, label: '128kbps' },
        { value: 256000, label: '256kbps' }
      ],
      formatOptions: [
        { value: 'mp3', label: 'MP3' },
        { value: 'pcm', label: 'PCM' },
        { value: 'flac', label: 'FLAC' }
      ],
      channelOptions: [
        { value: 1, label: '单声道' },
        { value: 2, label: '立体声' }
      ]
    }
  },
  methods: {
    openVoiceModelSelector() {
      this.showVoiceSelector = true
    },
    closeVoiceModelSelector() {
      this.showVoiceSelector = false
    },
    handleVoiceModelSelect(model) {
      this.selectedVoiceModel = model
      this.closeVoiceModelSelector()
      this.$emit('voice-model-change', model)
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
    
    async generateVoice() {
      if (!this.selectedVoiceModel || !this.ttsParams.text.trim()) {
        return
      }
      
      try {
        const params = {
          voice_id: this.selectedVoiceModel.voice_id,
          text: this.ttsParams.text,
          speed: parseFloat(this.ttsParams.speed.toFixed(2)),
          vol: parseFloat(this.ttsParams.vol.toFixed(2)),
          pitch: this.ttsParams.pitch,
          emotion: this.ttsParams.emotion,
          sample_rate: this.ttsParams.sample_rate,
          bitrate: this.ttsParams.bitrate,
          format: this.ttsParams.format,
          channel: this.ttsParams.channel
        }
        
        console.log('发送请求参数:', params)
        const response = await textToVoice(params)
        console.log('请求返回结果:', response)
      } catch (error) {
        console.error('请求失败:', error)
      }
    },
    
    resetVoiceParams() {
      this.ttsParams.speed = 1.00
      this.ttsParams.vol = 1.00
      this.ttsParams.pitch = 0
      this.ttsParams.emotion = 'auto'
      this.emitParamsChange()
    },
    
    resetAudioParams() {
      this.ttsParams.sample_rate = 32000
      this.ttsParams.bitrate = 128000
      this.ttsParams.format = 'mp3'
      this.ttsParams.channel = 1
      this.emitParamsChange()
    },
    
    emitParamsChange() {
      this.$emit('params-change', { ...this.ttsParams })
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
    
    toggleEmotionDropdown() {
      this.showEmotionDropdown = !this.showEmotionDropdown
      
      if (this.showEmotionDropdown) {
        // 添加全局点击监听器来关闭下拉菜单
        this.$nextTick(() => {
          document.addEventListener('click', this.handleClickOutside)
        })
      } else {
        document.removeEventListener('click', this.handleClickOutside)
      }
    },
    
    handleClickOutside(event) {
      if (this.$refs.emotionDropdown && !this.$refs.emotionDropdown.contains(event.target)) {
        this.showEmotionDropdown = false
        document.removeEventListener('click', this.handleClickOutside)
      }
    },
    
    selectEmotion(emotion) {
      this.ttsParams.emotion = emotion
      this.showEmotionDropdown = false
      document.removeEventListener('click', this.handleClickOutside)
      this.emitParamsChange()
    },
    
    getEmotionIcon(emotion) {
      const option = this.emotionOptions.find(opt => opt.value === emotion)
      return option ? option.icon : '🤖'
    },
    
    getEmotionLabel(emotion) {
      const option = this.emotionOptions.find(opt => opt.value === emotion)
      return option ? option.label : '自动'
    },
    
    // 采样率相关方法
    toggleSampleRateDropdown() {
      this.showSampleRateDropdown = !this.showSampleRateDropdown
      if (this.showSampleRateDropdown) {
        this.$nextTick(() => {
          document.addEventListener('click', this.handleSampleRateClickOutside)
        })
      } else {
        document.removeEventListener('click', this.handleSampleRateClickOutside)
      }
    },
    
    handleSampleRateClickOutside(event) {
      if (this.$refs.sampleRateDropdown && !this.$refs.sampleRateDropdown.contains(event.target)) {
        this.showSampleRateDropdown = false
        document.removeEventListener('click', this.handleSampleRateClickOutside)
      }
    },
    
    selectSampleRate(value) {
      this.ttsParams.sample_rate = value
      this.showSampleRateDropdown = false
      document.removeEventListener('click', this.handleSampleRateClickOutside)
      this.emitParamsChange()
    },
    
    getSampleRateLabel(value) {
      const option = this.sampleRateOptions.find(opt => opt.value === value)
      return option ? option.label : '32kHz'
    },
    
    // 比特率相关方法
    toggleBitrateDropdown() {
      this.showBitrateDropdown = !this.showBitrateDropdown
      if (this.showBitrateDropdown) {
        this.$nextTick(() => {
          document.addEventListener('click', this.handleBitrateClickOutside)
        })
      } else {
        document.removeEventListener('click', this.handleBitrateClickOutside)
      }
    },
    
    handleBitrateClickOutside(event) {
      if (this.$refs.bitrateDropdown && !this.$refs.bitrateDropdown.contains(event.target)) {
        this.showBitrateDropdown = false
        document.removeEventListener('click', this.handleBitrateClickOutside)
      }
    },
    
    selectBitrate(value) {
      this.ttsParams.bitrate = value
      this.showBitrateDropdown = false
      document.removeEventListener('click', this.handleBitrateClickOutside)
      this.emitParamsChange()
    },
    
    getBitrateLabel(value) {
      const option = this.bitrateOptions.find(opt => opt.value === value)
      return option ? option.label : '128kbps'
    },
    
    // 格式相关方法
    toggleFormatDropdown() {
      this.showFormatDropdown = !this.showFormatDropdown
      if (this.showFormatDropdown) {
        this.$nextTick(() => {
          document.addEventListener('click', this.handleFormatClickOutside)
        })
      } else {
        document.removeEventListener('click', this.handleFormatClickOutside)
      }
    },
    
    handleFormatClickOutside(event) {
      if (this.$refs.formatDropdown && !this.$refs.formatDropdown.contains(event.target)) {
        this.showFormatDropdown = false
        document.removeEventListener('click', this.handleFormatClickOutside)
      }
    },
    
    selectFormat(value) {
      this.ttsParams.format = value
      this.showFormatDropdown = false
      document.removeEventListener('click', this.handleFormatClickOutside)
      this.emitParamsChange()
    },
    
    getFormatLabel(value) {
      const option = this.formatOptions.find(opt => opt.value === value)
      return option ? option.label : 'MP3'
    },
    
    // 通道数相关方法
    toggleChannelDropdown() {
      this.showChannelDropdown = !this.showChannelDropdown
      if (this.showChannelDropdown) {
        this.$nextTick(() => {
          document.addEventListener('click', this.handleChannelClickOutside)
        })
      } else {
        document.removeEventListener('click', this.handleChannelClickOutside)
      }
    },
    
    handleChannelClickOutside(event) {
      if (this.$refs.channelDropdown && !this.$refs.channelDropdown.contains(event.target)) {
        this.showChannelDropdown = false
        document.removeEventListener('click', this.handleChannelClickOutside)
      }
    },
    
    selectChannel(value) {
      this.ttsParams.channel = value
      this.showChannelDropdown = false
      document.removeEventListener('click', this.handleChannelClickOutside)
      this.emitParamsChange()
    },
    
    getChannelLabel(value) {
      const option = this.channelOptions.find(opt => opt.value === value)
      return option ? option.label : '单声道'
    }
  },
  
  watch: {
    ttsParams: {
      handler() {
        this.emitParamsChange()
      },
      deep: true
    }
  },
  
  beforeDestroy() {
    // 清理所有事件监听器
    document.removeEventListener('click', this.handleClickOutside)
    document.removeEventListener('click', this.handleSampleRateClickOutside)
    document.removeEventListener('click', this.handleBitrateClickOutside)
    document.removeEventListener('click', this.handleFormatClickOutside)
    document.removeEventListener('click', this.handleChannelClickOutside)
  }
}
</script>

<style scoped>
.right-sidebar {
  position: static;
  width: 300px;
  height: 100%;
  background: transparent;
  display: flex;
  flex-direction: column;
}

.right-sidebar.visible {
  display: flex;
}

.sidebar-content {
  flex: 1;
  padding: 30px 20px;
  overflow-y: auto;
}

.voice-model-section {
  margin-bottom: 25px;
}

.voice-model-card {
  background: transparent;
  border-radius: 20px;
  padding: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid rgba(102, 126, 234, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.voice-model-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.voice-model-card:hover {
  transform: translateY(-5px);
  border-color: rgba(102, 126, 234, 0.6);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.2);
}

.voice-model-card:hover::before {
  opacity: 1;
}

.card-content {
  width: 100%;
  text-align: center;
  position: relative;
  z-index: 2;
}

.selected-model {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.selected-avatar {
  width: 80px;
  height: 80px;
}

.selected-avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(102, 126, 234, 0.3);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
  transition: all 0.3s ease;
}

.selected-avatar-image:hover {
  transform: scale(1.05);
  border-color: rgba(102, 126, 234, 0.6);
  box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
}

.model-name {
  font-size: 18px;
  font-weight: 900;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  text-shadow: 0 0 25px rgba(102, 126, 234, 0.4);
  letter-spacing: 2px;
  text-transform: uppercase;
}

.placeholder-text {
  margin: 0;
}

.fancy-text {
  font-size: 16px;
  font-weight: 900;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(102, 126, 234, 0.4);
  letter-spacing: 2px;
  position: relative;
}

.fancy-text::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-radius: 8px;
  animation: glow 2s ease-in-out infinite alternate;
  z-index: -1;
}

@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes glow {
  from {
    opacity: 0.2;
    transform: scale(1);
  }
  to {
    opacity: 0.4;
    transform: scale(1.05);
  }
}

/* 滚动条样式 */
.sidebar-content::-webkit-scrollbar {
  width: 4px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* 新增组件样式 */
.text-input-section, .voice-params-section, .audio-params-section, .generate-section {
  margin-bottom: 25px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #2c3e50;
  margin-top: 40px;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.text-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  transition: all 0.3s ease;
  background: rgba(248, 249, 255, 0.8);
  font-family: inherit;
}

.text-input:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.6);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: white;
}

.text-input::placeholder {
  color: #a0a9b8;
}

.param-group {
  margin-bottom: 16px;
}

.param-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.param-label {
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
}

.param-value {
  padding: 6px 10px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.08) 100%);
  border: 1px solid rgba(102, 126, 234, 0.25);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #5a67d8;
  min-width: 45px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3);
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 15px;
}

.reset-icon {
  background: none;
  border: none;
  color: #8b949e;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  border-radius: 4px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  height: 1em;
  margin-top: -2px;
}

.reset-icon:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  transform: rotate(180deg);
}

.reset-icon:active {
  transform: rotate(180deg) scale(0.9);
}

.param-slider {
  width: 100%;
  height: 8px;
  border-radius: 10px;
  background: linear-gradient(to right, #f1f5f9 0%, #e2e8f0 100%);
  outline: none;
  -webkit-appearance: none;
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(255, 255, 255, 0.5);
  position: relative;
}

.param-slider:hover {
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(255, 255, 255, 0.6);
}

.param-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  box-shadow: 
    0 4px 12px rgba(102, 126, 234, 0.35),
    0 0 0 3px rgba(255, 255, 255, 0.9),
    0 0 0 1px rgba(102, 126, 234, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  position: relative;
}

.param-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6), 0 0 0 4px rgba(102, 126, 234, 0.1), 0 0 0 3px rgba(255, 255, 255, 0.9);
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}

.param-slider::-webkit-slider-thumb:active {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.8), 0 0 0 3px rgba(255, 255, 255, 0.9);
}

.param-select {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid rgba(102, 126, 234, 0.12);
  border-radius: 12px;
  font-size: 13px;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  color: #1e293b;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 6px;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  font-weight: 500;
  position: relative;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23667eea' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 45px;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.param-select:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.5);
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15), 0 4px 16px rgba(102, 126, 234, 0.2);
  background: linear-gradient(145deg, #ffffff 0%, #fefefe 100%);
  transform: translateY(-1px);
}

.param-select:hover {
  border-color: rgba(102, 126, 234, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transform: translateY(-1px);
}

/* 下拉菜单容器的边框样式 */
.param-select {
  /* 为下拉菜单设置柔和的边框色调 */
  border-color: rgba(148, 163, 184, 0.25);
  filter: drop-shadow(0 4px 12px rgba(148, 163, 184, 0.15));
}

/* 当选择框展开时的样式 */
.param-select:focus,
.param-select:active {
  /* 设置更柔和的边框颜色 */
  box-shadow: 
    0 0 0 4px rgba(148, 163, 184, 0.12),
    0 4px 16px rgba(148, 163, 184, 0.2);
}

/* 尝试影响下拉选项的样式 */
.param-select option {
  background-color: #ffffff;
  color: #475569;
  padding: 8px 12px;
}



.param-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.half-width {
  flex: 1;
}

.generate-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  letter-spacing: 0.5px;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}

.generate-btn:active {
  transform: translateY(0);
}

.generate-btn:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 自定义下拉菜单样式 */
.custom-dropdown {
  position: relative;
  cursor: pointer;
  margin-top: 6px;
}

.dropdown-selected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border: 2px solid rgba(102, 126, 234, 0.12);
  border-radius: 12px;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  color: #1e293b;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.dropdown-selected:hover {
  border-color: rgba(102, 126, 234, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transform: translateY(-1px);
}

.selected-emotion-icon {
  font-size: 18px;
  margin-right: 10px;
}

.selected-emotion-text {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
}

.dropdown-arrow {
  width: 20px;
  height: 20px;
  color: #667eea;
  transition: transform 0.3s ease;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid rgba(102, 126, 234, 0.15);
  border-radius: 12px;
  z-index: 1000;
  margin-top: 4px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  animation: dropdownFadeIn 0.2s ease-out;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.06) 100%);
  transform: translateX(2px);
}

.dropdown-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.08) 100%);
  color: #667eea;
  font-weight: 600;
}

.emotion-icon {
  font-size: 20px;
  margin-right: 12px;
  min-width: 24px;
  text-align: center;
}

.emotion-label {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.check-icon {
  width: 18px;
  height: 18px;
  color: #10b981;
  margin-left: 8px;
}

/* 为没有图标的下拉菜单添加样式 */
.selected-text {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
}

.option-label {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}
</style>