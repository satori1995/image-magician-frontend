<template>
  <div id="app" contenteditable="false">
    <Navbar @tab-change="handleTabChange" />
    <div class="app-body">
      <Sidebar :current-function="currentFunction" :current-tab="currentTab" @function-change="handleFunctionChange" />
      <main class="main-content" :class="{ 'with-right-sidebar': showRightSidebar && currentFunction === 'text-to-speech' }">
        <!-- 图片功能 -->
        <WallpaperSearch v-if="currentFunction === 'wallpaper-search'" />
        <AnimeImage v-else-if="currentFunction === 'anime-image'" />
        <!-- 音乐功能 -->
        <TextToSpeech 
          v-else-if="currentFunction === 'text-to-speech'" 
          :selected-voice-model="selectedVoiceModel"
          :tts-params="ttsParams"
          :audio-data="audioData"
          :is-generating="isGenerating"
          @generate-speech="handleGenerateSpeech"
        />
        <div v-else class="content-area">
          <!-- Other functions will be implemented here -->
        </div>
      </main>
      
      <!-- 右侧边栏 -->
      <div v-if="showRightSidebar && currentFunction === 'text-to-speech'" class="right-sidebar-container">
        <RightSidebar 
          :is-visible="true"
          @close="handleRightSidebarClose"
          @voice-model-change="handleVoiceModelChange"
          @params-change="handleParamsChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from './components/Navbar.vue'
import Sidebar from './components/Sidebar.vue'
import RightSidebar from './components/RightSidebar.vue'
import WallpaperSearch from './components/WallpaperSearch.vue'
import AnimeImage from './components/AnimeImage.vue'
import TextToSpeech from './components/TextToSpeech.vue'
import { textToVoice } from './services/api.js'

export default {
  name: 'App',
  components: {
    Navbar,
    Sidebar,
    RightSidebar,
    WallpaperSearch,
    AnimeImage,
    TextToSpeech
  },
  data() {
    return {
      currentTab: 'audio',
      currentFunction: 'text-to-speech',
      showRightSidebar: true,
      selectedVoiceModel: null,
      ttsParams: {
        speed: 1.00,
        vol: 1.00,
        pitch: 0,
        emotion: 'auto',
        sample_rate: 32000,
        bitrate: 128000,
        format: 'mp3',
        channel: 1
      },
      audioData: null,
      isGenerating: false
    }
  },
  methods: {
    handleTabChange(tab) {
      this.currentTab = tab
      // 切换标签页时，重置为对应的默认功能
      if (tab === 'audio') {
        this.currentFunction = 'text-to-speech'
        this.showRightSidebar = true
      } else if (tab === 'image') {
        this.currentFunction = 'wallpaper-search'
        this.showRightSidebar = false
      }
    },
    handleFunctionChange(functionName) {
      this.currentFunction = functionName
      // 如果选择文本转语音功能，显示右侧边栏
      if (functionName === 'text-to-speech') {
        this.showRightSidebar = true
      } else {
        this.showRightSidebar = false
      }
    },
    handleRightSidebarClose() {
      this.showRightSidebar = false
    },
    handleVoiceModelChange(model) {
      this.selectedVoiceModel = model
      console.log('选择的音色模型:', model)
    },
    
    handleParamsChange(params) {
      this.ttsParams = { ...params }
    },
    
    async handleGenerateSpeech(text) {
      if (!this.selectedVoiceModel || !text.trim()) {
        console.warn('缺少必要参数：音色模型或文本')
        return
      }
      
      this.isGenerating = true
      this.audioData = null
      
      try {
        const params = {
          voice_id: this.selectedVoiceModel.voice_id,
          text: text.trim(),
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
        
        // 检查响应格式
        if (response.code === 200 && response.data) {
          const audioHex = response.data.data.audio
          const extraInfo = response.data.extra_info
          
          if (audioHex) {
            // 将16进制字符串转换为音频blob
            const audioBlob = this.hexToAudioBlob(audioHex, extraInfo.audio_format)
            const audioUrl = URL.createObjectURL(audioBlob)
            
            this.audioData = {
              url: audioUrl,
              extraInfo: extraInfo,
              traceId: response.data.trace_id
            }
            
            console.log('音频生成成功:', {
              audioLength: extraInfo.audio_length,
              audioSize: extraInfo.audio_size,
              format: extraInfo.audio_format,
              sampleRate: extraInfo.audio_sample_rate
            })
          }
        }
      } catch (error) {
        console.error('请求失败:', error)
        alert('语音生成失败，请重试')
      } finally {
        this.isGenerating = false
      }
    },
    
    hexToAudioBlob(hexString, format) {
      // 将16进制字符串转换为字节数组
      const bytes = []
      for (let i = 0; i < hexString.length; i += 2) {
        bytes.push(parseInt(hexString.substr(i, 2), 16))
      }
      
      // 创建Uint8Array
      const uint8Array = new Uint8Array(bytes)
      
      // 根据格式确定MIME类型
      let mimeType = 'audio/mpeg' // 默认MP3
      if (format === 'wav' || format === 'pcm') {
        mimeType = 'audio/wav'
      } else if (format === 'flac') {
        mimeType = 'audio/flac'
      }
      
      // 创建Blob
      return new Blob([uint8Array], { type: mimeType })
    }
  }
}
</script>

<style>
#app {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.app-body {
  flex: 1;
  position: relative;
  min-height: calc(100vh - 80px);
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.main-content {
  position: absolute;
  left: 280px;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: #f5f5f5;
  overflow-y: auto;
  height: calc(100vh - 80px);
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.main-content.with-right-sidebar {
  right: 300px;
}

.content-area {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 28px;
  font-weight: 600;
}

p {
  color: #7f8c8d;
  font-size: 16px;
  line-height: 1.6;
}

.right-sidebar-container {
  position: absolute;
  right: 0;
  top: 0;
  width: 300px;
  height: 100%;
  background-color: #f5f5f5;
}
</style>