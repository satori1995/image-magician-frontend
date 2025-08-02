<template>
  <nav class="navbar" contenteditable="false">
    <div class="navbar-container">
      <div class="navbar-menu">
        <button 
          class="navbar-item fancy-text"
          :class="{ active: activeTab === 'audio' }"
          @click="setActiveTab('audio')"
        >
          <span class="text-content">🎵 音频 🎵</span>
          <div class="button-glow"></div>
        </button>
        <button 
          class="navbar-item fancy-text"
          :class="{ active: activeTab === 'image' }"
          @click="setActiveTab('image')"
        >
          <span class="text-content">✨ 图像 ✨</span>
          <div class="button-glow"></div>
        </button>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'Navbar',
  data() {
    return {
      activeTab: 'audio'
    }
  },
  methods: {
    setActiveTab(tab) {
      this.activeTab = tab
      this.$emit('tab-change', tab)
    }
  }
}
</script>

<style scoped>
.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.navbar-container {
  width: 100%;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 80px;
}

.navbar-menu {
  display: flex;
  gap: 30px;
}

.navbar-item {
  position: relative;
  padding: 15px 30px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.4s ease;
  overflow: hidden;
}

.fancy-text {
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.text-content {
  font-size: 20px;
  position: relative;
  z-index: 2;
  background: linear-gradient(45deg, #f8f9fa, #ffd93d, #ff6348, #6c5ce7, #e84393);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientShift 3s ease-in-out infinite;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.button-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 23px;
}

.navbar-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
}

.navbar-item:hover .button-glow {
  opacity: 0.2;
}

.navbar-item.active {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.navbar-item.active .button-glow {
  opacity: 0.3;
}

.navbar-item.active .text-content {
  animation-duration: 2s;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
}

@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes sparkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}
</style>