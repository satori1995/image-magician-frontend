<template>
  <div id="app">
    <ImageEditor />
  </div>
</template>

<script>
// 改为相对路径
import ImageEditor from './views/ImageEditor.vue'

export default {
  name: 'App',
  components: {
    ImageEditor
  }
}
</script>

<style>
#app {
  height: 100vh;
  width: 100vw;
}
</style>