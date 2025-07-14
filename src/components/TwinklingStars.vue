<template>
  <div class="twinkling-stars" v-if="show">
    <div
      v-for="star in stars"
      :key="star.id"
      class="star"
      :style="{
        left: star.x + '%',
        top: star.y + '%',
        animationDelay: star.delay + 's',
        animationDuration: star.duration + 's'
      }"
    >
      ✨
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'

export default {
  name: 'TwinklingStars',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    starCount: {
      type: Number,
      default: 20
    }
  },
  setup(props) {
    const stars = ref([])

    // 生成随机星星位置和动画参数
    const generateStars = () => {
      stars.value = Array.from({ length: props.starCount }, (_, index) => ({
        id: index,
        x: Math.random() * 100, // 0-100% 横向位置
        y: Math.random() * 100, // 0-100% 纵向位置
        delay: Math.random() * 0.5, // 0-0.5秒延迟
        duration: 1 + Math.random() * 2 // 1-3秒动画时长
      }))
    }

    // 定时重新生成星星位置，让动画更加动态
    let intervalId = null
    
    onMounted(() => {
      generateStars()
      intervalId = setInterval(generateStars, 3000) // 每3秒重新生成
    })

    onUnmounted(() => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    })

    return {
      stars
    }
  }
}
</script>

<style scoped>
.twinkling-stars {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
  overflow: hidden;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.star {
  position: absolute;
  font-size: 24px;
  animation: twinkle infinite ease-in-out;
  transform-origin: center;
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0.5) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.2) rotate(180deg);
  }
}

/* 不同大小的星星 */
.star:nth-child(3n) {
  font-size: 20px;
}

.star:nth-child(3n+1) {
  font-size: 28px;
}

.star:nth-child(3n+2) {
  font-size: 24px;
}

/* 添加一些颜色变化 */
.star:nth-child(4n) {
  filter: hue-rotate(60deg);
}

.star:nth-child(4n+1) {
  filter: hue-rotate(120deg);
}

.star:nth-child(4n+2) {
  filter: hue-rotate(240deg);
}
</style>