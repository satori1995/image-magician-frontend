<template>
  <div class="control-bar">
    <!-- 缩放控制 -->
    <div class="zoom-controls">
      <button
        class="zoom-btn"
        :disabled="!canZoomOut"
        @click="$emit('zoom-out')"
        title="缩小"
      >
        <ZoomOut :size="18" />
      </button>

      <div class="zoom-display">
        {{ zoomPercentage }}%
      </div>

      <button
        class="zoom-btn"
        :disabled="!canZoomIn"
        @click="$emit('zoom-in')"
        title="放大"
      >
        <ZoomIn :size="18" />
      </button>
    </div>

    <!-- 分隔线 -->
    <div class="divider"></div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button
        class="btn btn-primary"
        @click="$emit('download')"
        title="下载图像"
      >
        <Download :size="18" />
        <span>下载</span>
      </button>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { ZoomIn, ZoomOut, Download } from 'lucide-vue-next'

export default {
  name: 'ControlBar',
  components: {
    ZoomIn,
    ZoomOut,
    Download
  },
  props: {
    zoom: {
      type: Number,
      required: true
    },
    canZoomIn: Boolean,
    canZoomOut: Boolean
  },
  emits: ['zoom-in', 'zoom-out', 'download'],
  setup(props) {
    const zoomPercentage = computed(() => {
      return Math.round(props.zoom * 100)
    })

    return {
      zoomPercentage
    }
  }
}
</script>

<style scoped>
.control-bar {
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 20px 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.zoom-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: #374151;
}

.zoom-btn:hover:not(:disabled) {
  background: #e5e7eb;
  transform: scale(1.05);
}

.zoom-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.zoom-display {
  padding: 8px 16px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
  min-width: 70px;
  text-align: center;
}

.divider {
  width: 1px;
  height: 32px;
  background: #e5e7eb;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}
</style>

