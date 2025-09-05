<script setup>
defineProps({
  progress: {
    type: Number,
    required: true
  }
})
</script>

<template>
  <div class="progress-container">
    <div class="progress-bar" :style="{ width: progress + '%' }"></div>
  </div>
</template>

<style scoped>
.progress-container {
  width: 95%;
  height: 20px;
  border: 2px solid white;
  border-radius: 13px;
  overflow: hidden;
  margin: 0 auto;

  padding: 0.2rem
}

.progress-bar {
  height: 100%;
  border-radius: 13px;
  background-color: white;
  transition: width 0.3s ease;
}
</style>
