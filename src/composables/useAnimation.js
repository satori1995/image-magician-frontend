import { ref } from 'vue'
import { ANIMATION_DURATION } from '@/utils/constants.js'

export function useAnimation() {
  const isFlashing = ref(false)
  const isRevealing = ref(false)

  /**
   * 闪烁效果
   */
  const startFlash = (duration = ANIMATION_DURATION.FLASH) => {
    isFlashing.value = true

    return new Promise((resolve) => {
      setTimeout(() => {
        isFlashing.value = false
        resolve()
      }, duration)
    })
  }

  /**
   * 停止闪烁
   */
  const stopFlash = () => {
    isFlashing.value = false
  }

  /**
   * 揭示效果
   */
  const startReveal = (duration = ANIMATION_DURATION.REVEAL) => {
    isRevealing.value = true

    return new Promise((resolve) => {
      setTimeout(() => {
        // 保持揭示状态，不重置为false
        resolve()
      }, duration)
    })
  }

  /**
   * 组合动画：闪烁 + 揭示
   */
  const playProcessingAnimation = async () => {
    // 开始闪烁
    const flashPromise = startFlash()

    // 等待闪烁完成后开始揭示
    await flashPromise
    await startReveal()
  }

  /**
   * 重置所有动画状态
   */
  const resetAnimations = () => {
    isFlashing.value = false
    isRevealing.value = false
  }

  /**
   * 保持揭示状态
   */
  const keepRevealed = () => {
    isRevealing.value = true
  }

  return {
    isFlashing,
    isRevealing,
    startFlash,
    stopFlash,
    startReveal,
    playProcessingAnimation,
    resetAnimations,
    keepRevealed
  }
}

