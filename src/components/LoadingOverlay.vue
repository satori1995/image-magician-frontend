<template>
  <div class="loading-overlay">
    <div class="loading-content">
      <Loader2 class="loading-spinner" :size="24" />
      <span class="loading-text">正在处理中...</span>
    </div>
  </div>
</template>

<script>
import { Loader2 } from 'lucide-vue-next'

export default {
  name: 'LoadingOverlay',
  components: {
    Loader2
  }
}
</script>

<style scoped>
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
  z-index: 10;
}

.loading-content {
  background: white;
  padding: 24px 32px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.loading-spinner {
  color: #3b82f6;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: #374151;
  font-weight: 500;
  font-size: 0.95rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

