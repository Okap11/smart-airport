<template>
  <div class="scene-page">
    <CesiumViewer ref="viewerRef" @ready="onReady" @error="onError" />

    <!-- 顶部工具栏 -->
    <div class="top-bar">
      <a-button shape="round" @click="router.push('/')">← 总览大屏</a-button>
      <span class="page-title">机场三维场景</span>
      <div class="top-right">
        <span class="label">相机跟随：</span>
        <a-radio-group
          :value="store.followMode"
          size="small"
          @change="onFollowChange"
        >
          <a-radio-button value="latlon">经纬度跟随</a-radio-button>
          <a-radio-button value="enu">ENU 精确跟随</a-radio-button>
          <a-radio-button value="none">关闭跟随</a-radio-button>
        </a-radio-group>

        <span class="label" style="margin-left: 14px">视角：</span>
        <a-radio-group
          :value="viewPreset"
          size="small"
          @change="onViewPreset"
        >
          <a-radio-button value="front">前</a-radio-button>
          <a-radio-button value="back">后</a-radio-button>
          <a-radio-button value="left">左</a-radio-button>
          <a-radio-button value="right">右</a-radio-button>
        </a-radio-group>

        <span class="label" style="margin-left: 14px">键盘控制：</span>
        <a-switch
          :checked="store.manualControl"
          size="small"
          @change="onManualControl"
        />

        <a-spin v-if="store.loading" size="small" style="margin-left: 10px">
          <template #tip>场景加载中…</template>
        </a-spin>
      </div>
    </div>

    <!-- 左侧图层面板 -->
    <div class="layer-panel">
      <a-card title="图层控制" size="small" :bordered="true">
        <div class="layer-item">
          <a-checkbox
            :checked="store.layers.base"
            @change="onToggle('base', $event)"
          >影像底图</a-checkbox>
        </div>
        <div class="layer-item">
          <a-checkbox
            :checked="store.layers.annotation"
            @change="onToggle('annotation', $event)"
          >注记</a-checkbox>
        </div>
        <div class="layer-item">
          <a-checkbox
            :checked="store.layers.tileset"
            @change="onToggle('tileset', $event)"
          >3DTiles 场景</a-checkbox>
        </div>
        <div class="layer-item">
          <a-checkbox
            :checked="store.layers.aircraft"
            @change="onToggle('aircraft', $event)"
          >飞机模型</a-checkbox>
        </div>
      </a-card>
    </div>

    <!-- 加载错误提示 -->
    <a-alert
      v-if="store.error"
      class="error-alert"
      type="error"
      :message="`场景加载出错：${store.error}`"
      description="请检查 src/config/index.js 的配置：天地图 key、Cesium ion token、本地 tileset（src/assets/cesium/tileset/）是否就绪。"
      closable
    />

    <!-- 右下：航班趋势图表（mock 数据，学习用） -->
    <div class="chart-panel">
      <a-card title="今日航班架次趋势（模拟数据）" size="small" :bordered="true">
        <div class="chart-box">
          <ChartPanel :option="flightOption" />
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import CesiumViewer from '@/components/3d/CesiumViewer.vue'
import ChartPanel from '@/components/ChartPanel.vue'
import { use3dStore } from '@/stores/use3dStore'
import { getFlightTrend } from '@/api/mock'
import type { FollowMode } from '@/config'
import type { EChartsOption } from 'echarts'

/** 预设视角 key */
type ViewPresetKey = 'front' | 'back' | 'left' | 'right'
/** 图层 key */
type LayerKey = keyof ReturnType<typeof use3dStore>['layers']

const router = useRouter()
const store = use3dStore()
const viewerRef = ref<InstanceType<typeof CesiumViewer> | null>(null)

function onReady(viewer: unknown) {
  console.log('[Scene] 场景就绪，viewer 已创建', viewer)
}

function onError(e: unknown) {
  console.error('[Scene] 场景加载失败', e)
}

function onToggle(key: LayerKey, e: { target: { checked: boolean } }) {
  if (e.target.checked !== store.layers[key]) {
    store.layers[key] = e.target.checked
  }
}

function onFollowChange(e: { target: { value: string } }) {
  const mode = e.target.value as FollowMode
  store.setFollowMode(mode)
  viewerRef.value?.setFollowMode(mode)
}

/** 切换预设视角（前/后/左/右）：保持当前跟随，相机以该视角持续跟随飞机 */
const viewPreset = ref<ViewPresetKey>('back') // 默认视角：后方

function onViewPreset(e: { target: { value: string } }) {
  const view = e.target.value as ViewPresetKey
  viewPreset.value = view
  viewerRef.value?.setViewPreset(view)
}

/** 键盘控制开关：开启后可用方向键/WASD 控制飞机飞行方向 */
function onManualControl(checked: boolean) {
  store.setManualControl(checked)
  viewerRef.value?.setManualControl(checked)
}

// —— 模拟航班趋势数据（来自数据层 api/mock.ts）——
const flightOption = computed<EChartsOption>(() => {
  const d = getFlightTrend()
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['出港', '进港'], textStyle: { fontSize: 10 } },
    grid: { left: 30, right: 12, top: 24, bottom: 20 },
    xAxis: { type: 'category', data: d.hours, axisLabel: { interval: 3, fontSize: 9 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 9 } },
    series: [
      { name: '出港', type: 'line', smooth: true, data: d.depart },
      { name: '进港', type: 'line', smooth: true, data: d.arrive }
    ]
  }
})
</script>

<style scoped>
.scene-page {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0a1428;
}

.top-bar {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  z-index: 20;
  white-space: nowrap;
}

.page-title {
  font-size: 15px;
  font-weight: 600;
  color: #0a4a8a;
}

.top-right {
  display: flex;
  align-items: center;
}

.label {
  font-size: 12px;
  color: #555;
  margin-right: 4px;
}

.layer-panel {
  position: absolute;
  top: 76px;
  left: 12px;
  width: 150px;
  z-index: 20;
}

.layer-item {
  padding: 3px 0;
}

.error-alert {
  position: absolute;
  top: 72px;
  left: 50%;
  transform: translateX(-50%);
  width: 520px;
  z-index: 30;
}

.chart-panel {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 320px;
  z-index: 20;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
}

.chart-box {
  height: 150px;
}
</style>
