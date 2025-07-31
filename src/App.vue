<template>
  <div id="app" contenteditable="false">
    <Navbar @tab-change="handleTabChange" />
    <div class="app-body">
      <Sidebar :current-function="currentFunction" :current-tab="currentTab" @function-change="handleFunctionChange" />
      <main class="main-content">
        <!-- 图片功能 -->
        <WallpaperSearch v-if="currentFunction === 'wallpaper-search'" />
        <AnimeImage v-else-if="currentFunction === 'anime-image'" />
        <!-- 音乐功能 -->
        <TextToSpeech v-else-if="currentFunction === 'text-to-speech'" />
        <div v-else class="content-area">
          <!-- Other functions will be implemented here -->
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import Navbar from './components/Navbar.vue'
import Sidebar from './components/Sidebar.vue'
import WallpaperSearch from './components/WallpaperSearch.vue'
import AnimeImage from './components/AnimeImage.vue'
import TextToSpeech from './components/TextToSpeech.vue'

export default {
  name: 'App',
  components: {
    Navbar,
    Sidebar,
    WallpaperSearch,
    AnimeImage,
    TextToSpeech
  },
  data() {
    return {
      currentTab: 'image',
      currentFunction: 'wallpaper-search'
    }
  },
  methods: {
    handleTabChange(tab) {
      this.currentTab = tab
      // 切换标签页时，重置为对应的默认功能
      if (tab === 'image') {
        this.currentFunction = 'wallpaper-search'
      } else if (tab === 'audio') {
        this.currentFunction = 'text-to-speech'
      }
    },
    handleFunctionChange(functionName) {
      this.currentFunction = functionName
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
</style>