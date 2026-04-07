<template>
  <Line :data="data" :options="mergedOptions" />
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const props = defineProps({
  data:    { type: Object, required: true },
  options: { type: Object, default: () => ({}) },
})

const defaultOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { titleFont: { family: 'Cairo' }, bodyFont: { family: 'Cairo' } },
  },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94A3B8', font: { family: 'Cairo', size: 10 } } },
    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94A3B8', font: { family: 'Cairo', size: 10 } } },
  }
}

const mergedOptions = computed(() => ({
  ...defaultOptions, ...props.options,
  plugins: { ...defaultOptions.plugins, ...(props.options.plugins ?? {}) },
  scales:  { ...defaultOptions.scales,  ...(props.options.scales  ?? {}) },
}))
</script>