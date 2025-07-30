<template>
  <div class="sidebar" contenteditable="false">
    <!-- 动态效果容器 -->
    <div class="effects-container">
      <div class="falling-petal" v-for="n in 8" :key="n" :style="getPetalStyle(n)">🌸</div>
    </div>
    
    <div class="sidebar-content">
      <div class="function-list">
        <button 
          class="function-item active"
          @click="selectFunction('wallpaper-search')"
        >
          <span class="function-icon">🖼️</span>
          <span class="function-name fancy-text">壁纸搜索</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Sidebar',
  methods: {
    selectFunction(functionName) {
      this.$emit('function-change', functionName)
    },
    getPetalStyle(index) {
      const left = Math.random() * 100
      const delay = Math.random() * 5
      const duration = 4 + Math.random() * 3
      return {
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
      }
    }
  }
}
</script>

<style scoped>
.sidebar {
  position: absolute;
  left: 0;
  top: 0;
  width: 280px;
  height: 100%;
  background: linear-gradient(180deg, #faf9f7 0%, #f4f2ee 100%);
  border-right: 1px solid #e2dfd8;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 10;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}





.sidebar-content {
  flex: 1;
  padding: 30px 20px;
  overflow-y: auto;
}

.function-category {
  margin-bottom: 30px;
}

.category-title {
  color: #bdc3c7;
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 15px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.function-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.function-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  width: 100%;
}

.function-item:hover {
  background: rgba(139, 69, 19, 0.08);
  transform: translateX(5px);
}

.function-item.active {
  background: transparent;
  color: #4a5568;
  border-left: 4px solid #3498db;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.2);
}

.function-icon {
  font-size: 20px;
  min-width: 22px;
}

.function-name {
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
}

.fancy-text {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: bold;
  font-size: 18px;
  color: #000000;
  letter-spacing: 0.5px;
}

.function-item.active .fancy-text {
  color: #3498db;
}

/* 动态效果样式 */
.effects-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 1;
}

.falling-petal {
  position: absolute;
  top: -30px;
  font-size: 24px;
  animation: fallingPetal 6s ease-in-out infinite;
  opacity: 0;
}

.sidebar-content {
  position: relative;
  z-index: 2;
}

@keyframes fallingPetal {
  0% {
    transform: translateY(-30px) rotate(0deg) translateX(0px);
    opacity: 0;
  }
  5% {
    opacity: 0;
  }
  15% {
    opacity: 0.6;
  }
  85% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(calc(100vh + 50px)) rotate(180deg) translateX(20px);
    opacity: 0;
  }
}


/* 滚动条样式 */
.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>