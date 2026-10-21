import { defineStore } from 'pinia'
import type { FollowMode } from '@/config'

/** 图层显隐开关状态 */
interface LayersState {
  base: boolean
  annotation: boolean
  tileset: boolean
  aircraft: boolean
}

/** 三维场景全局状态 */
interface State {
  loading: boolean
  baseLoaded: boolean
  tilesetLoaded: boolean
  aircraftLoaded: boolean
  error: string | null
  layers: LayersState
  followMode: FollowMode
  manualControl: boolean
}

/**
 * 三维场景全局状态
 * 负责：加载状态、错误、图层显隐开关、相机跟随模式、键盘控制。
 * 视图层（Scene.vue）通过该 store 与三维渲染层解耦。
 */
export const use3dStore = defineStore('3d', {
  state: (): State => ({
    // 加载状态
    loading: false,
    baseLoaded: false,
    tilesetLoaded: false,
    aircraftLoaded: false,
    error: null,

    // 图层显隐开关
    layers: {
      base: true, // 影像底图
      annotation: true, // 注记
      tileset: true, // 3DTiles 场景
      aircraft: true // 飞机
    },

    // 相机跟随模式 latlon | enu | none
    followMode: 'latlon',

    // 键盘手动控制飞机飞行方向
    manualControl: false
  }),

  actions: {
    toggleLayer(key: keyof LayersState) {
      if (key in this.layers) this.layers[key] = !this.layers[key]
    },
    setFollowMode(mode: FollowMode) {
      this.followMode = mode
    },
    setManualControl(on: boolean) {
      this.manualControl = on
    }
  }
})
