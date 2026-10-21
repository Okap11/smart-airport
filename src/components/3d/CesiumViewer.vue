<template>
  <div ref="container" class="cesium-container" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as Cesium from 'cesium'
import { initViewer, getViewer, destroyViewer } from '@/hooks/useCesium'
import { loadImagery } from './layers/BaseLayer'
import { loadTileset } from './layers/TilesetLayer'
import { createAircraft } from './entity/AircraftEntity'
import { use3dStore } from '@/stores/use3dStore'

/**
 * Cesium 场景容器组件
 * 职责：初始化 viewer → 加载天地图底图 → 加载 3DTiles → 加载飞机并开始飞行，
 *       并监听 store 的图层开关做显隐联动。
 * 纯场景装配，业务 UI 由父组件（Scene.vue）控制。
 */
const container = ref(null)
const store = use3dStore()
const emit = defineEmits(['ready', 'error'])

let aircraft = null
let tilesetObj = null
let imagery = { base: null, annotation: null }

onMounted(async () => {
  store.loading = true
  store.error = null
  try {
    initViewer(container.value)
    imagery = await loadImagery(getViewer())
    store.baseLoaded = true

    tilesetObj = await loadTileset(getViewer())
    store.tilesetLoaded = !!tilesetObj

    aircraft = createAircraft(getViewer())
    await aircraft.init()
    store.aircraftLoaded = true

    emit('ready', getViewer())
  } catch (e) {
    console.error('[CesiumViewer] 初始化失败', e)
    store.error = e?.message || String(e)
    emit('error', e)
  } finally {
    store.loading = false
  }
})

// 图层显隐联动：store.layers 变化时同步到场景
watch(
  () => store.layers,
  (val) => {
    const v = getViewer()
    if (!v) return
    if (imagery.base) imagery.base.show = !!val.base
    if (imagery.annotation) imagery.annotation.show = !!val.annotation
    if (tilesetObj) tilesetObj.show = !!val.tileset
    if (aircraft?.setVisible) aircraft.setVisible(!!val.aircraft)
  },
  { deep: true }
)

onBeforeUnmount(() => {
  aircraft?.destroy()
  destroyViewer()
})

/** 切换相机跟随模式 latlon | enu | none */
function setFollowMode(mode) {
  aircraft?.setFollowMode(mode)
}

/** 启用/关闭键盘手动控制飞机飞行方向 */
function setManualControl(on) {
  aircraft?.setManualControl(on)
}

/**
 * 预设视角：围绕飞机从 前/后/左/右 观察（relHeading 为相对飞机航向的角度，弧度）。
 * 设置后保持当前跟随模式，相机以该视角持续跟随飞机（飞机移动/转向时保持观察关系）。
 * 点右上角跟随模式的 radio 可复位到默认后方跟拍。
 */
const VIEW_PRESETS = {
  front: { relHeading: Math.PI / 2, pitch: 0, range: 1000 }, // 飞机正前方
  back: { relHeading: -Math.PI / 2, pitch: -15, range: 800 }, // 飞机正后方（默认跟拍视角）
  left: { relHeading: 0, pitch: 0, range: 800 }, // 飞机左侧
  right: { relHeading: Math.PI, pitch: 0, range: 800 } // 飞机右侧
}

function setViewPreset(view) {
  const v = getViewer()
  if (!v || !aircraft) return
  const p = VIEW_PRESETS[view]
  if (!p) return
  // 设置跟随视角预设，不切换跟随模式，视角持续跟随飞机
  aircraft.follow.setViewPreset({
    relHeading: p.relHeading,
    pitch: Cesium.Math.toRadians(p.pitch),
    distance: p.range
  })
}

defineExpose({ getViewer, setFollowMode, setManualControl, setViewPreset })
</script>

<style scoped>
.cesium-container {
  width: 100%;
  height: 100%;
}
</style>
