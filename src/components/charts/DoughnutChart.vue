<template>
  <Doughnut :data="data" :options="mergedOptions" />
</template>

<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps({
  data:    { type: Object, required: true },
  options: { type: Object, default: () => ({}) },
})

const defaultOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: '#94A3B8', font: { family: 'Cairo', size: 11 }, padding: 12, boxWidth: 12 }
    },
    tooltip: { titleFont: { family: 'Cairo' }, bodyFont: { family: 'Cairo' } },
  }
}

const mergedOptions = computed(() => ({
  ...defaultOptions, ...props.options,
  plugins: { ...defaultOptions.plugins, ...(props.options.plugins ?? {}) },
}))
</script>