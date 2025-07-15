<template>
  <div
    v-if="visible"
    class="context-menu"
    :style="{ top: position.y + 'px', left: position.x + 'px' }"
    @click.stop
  >
    <div class="menu-item" @click="handleSelect">
      <span class="menu-icon">✓</span>
      选择该图片
    </div>
  </div>
</template>

<script>
export default {
  name: 'ContextMenu',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    position: {
      type: Object,
      default: () => ({ x: 0, y: 0 })
    }
  },
  emits: ['select'],
  setup(props, { emit }) {
    const handleSelect = () => {
      emit('select')
    }

    return {
      handleSelect
    }
  }
}
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  min-width: 150px;
  padding: 4px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 14px;
  color: #374151;
}

.menu-item:hover {
  background: #f3f4f6;
}

.menu-icon {
  color: #10b981;
  font-weight: bold;
}
</style>