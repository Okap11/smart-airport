<template>
  <div ref="el" class="echart" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'

/**
 * 轻量 ECharts 封装：自动初始化 / 销毁 / 响应式尺寸 / option 热更新
 */
const props = defineProps({
  option: { type: Object, required: true }
})

const el = ref(null)
let chart = null

const resize = () => chart?.resize()

onMounted(() => {
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
