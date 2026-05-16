<template>
  <div class="print-template">
    <div class="print-header">
      <h1>تقرير</h1>
    </div>
    <div class="print-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.print-template { padding: 20px; direction: rtl; }
.print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
.print-header h1 { font-size: 1.5rem; margin: 0; }
.print-content { font-size: 0.9rem; }
</style>
