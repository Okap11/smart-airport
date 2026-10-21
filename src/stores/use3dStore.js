import { defineStore } from 'pinia'

/**
 * 三维场景全局状态
 * 负责：加载状态、错误、图层显隐开关、相机跟随模式。
 * 视图层（Scene.vue）通过该 store 与三维渲染层解耦。
 */
export const use3dStore = defineStore('3d', {
  state: () => ({
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
    toggleLayer(key) {
      if (key in this.layers) this.layers[key] = !this.layers[key]
    },
    setFollowMode(mode) {
      this.followMode = mode
    },
    setManualControl(on) {
      this.manualControl = on
    }
  }
})
