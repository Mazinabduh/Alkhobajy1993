<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // تهيئة الثيم
  const theme = localStorage.getItem('khubji_theme') || 'dark'
  document.documentElement.className = `theme-${theme}`
})
</script>
