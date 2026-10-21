<template>
  <div ref="el" class="echart" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

/**
 * 轻量 ECharts 封装：自动初始化 / 销毁 / 响应式尺寸 / option 热更新
 */
const props = defineProps<{
  option: EChartsOption
}>()

const el = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

const resize = () => chart?.resize()

onMounted(() => {
  if (!el.value) return
  chart = echarts.init(el.value)
  chart.setOption(props.option)
  window.addEventListener('resize', resize)
})

watch(
  () => props.option,
  (opt) => {
    if (chart) {
      chart.setOption(opt)
    }
  },
  { deep: true }
)

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.echart {
  width: 100%;
  height: 100%;
}
</style>
