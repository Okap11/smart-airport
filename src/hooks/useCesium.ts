import * as Cesium from 'cesium'
import { ion } from '@/config'

/**
 * Cesium 核心 Hook（单例）
 * 统一负责 Viewer 的创建、销毁、坐标工具与相机操作。
 * 原生 viewer 对象较重，不放入响应式 store，用模块级单例持有。
 */

let viewer: Cesium.Viewer | null = null

const DEFAULT_OPTIONS: Cesium.Viewer.ConstructorOptions = {
  // 底图由 BaseLayer 统一加载（天地图），此处关掉默认 ion/Bing 底图
  baseLayer: false,
  // 关闭默认 UI 控件，界面用 antdv 自绘
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  animation: false,
  timeline: false,
  fullscreenButton: false,
  infoBox: false,
  selectionIndicator: false,
  shouldAnimate: true
}

/**
 * 初始化 Cesium Viewer
 * @param container 容器元素或 id
 * @param options 覆盖默认配置
 */
export function initViewer(
  container: HTMLElement | string,
  options: Partial<Cesium.Viewer.ConstructorOptions> = {}
): Cesium.Viewer {
  // 将 ion token 注入 Cesium 引擎，否则 Cesium3DTileset.fromIonAssetId 无法加载 ion 资产
  if (ion.token) {
    Cesium.Ion.defaultAccessToken = ion.token
  }
  if (viewer) {
    console.warn('[useCesium] Viewer 已存在，先 destroy 再重建')
    return viewer
  }
  viewer = new Cesium.Viewer(container, {
    ...DEFAULT_OPTIONS,
    ...options
  })
  // 学习项目默认关闭大气/星空等，聚焦业务图层，可按需开启
  viewer.scene.globe.depthTestAgainstTerrain = false
  if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = true
  return viewer
}

/** 获取当前 viewer（不存在返回 null） */
export function getViewer(): Cesium.Viewer | null {
  return viewer
}

/** 销毁 viewer */
export function destroyViewer(): void {
  if (viewer) {
    viewer.destroy()
    viewer = null
  }
}

/** 经纬度+高程 → 笛卡尔坐标 */
export function toCartesian(lon: number, lat: number, height = 0): Cesium.Cartesian3 {
  return Cesium.Cartesian3.fromDegrees(lon, lat, height)
}

/** 笛卡尔坐标 → { lon, lat, height } */
export function toLonLat(cartesian: Cesium.Cartesian3): {
  lon: number
  lat: number
  height: number
} {
  const c = Cesium.Cartographic.fromCartesian(cartesian)
  return {
    lon: Cesium.Math.toDegrees(c.longitude),
    lat: Cesium.Math.toDegrees(c.latitude),
    height: c.height
  }
}

/** 相机飞行到某位置 */
export function flyTo(lon: number, lat: number, height = 10000, duration = 2): void {
  if (!viewer) return
  viewer.camera.flyTo({
    destination: toCartesian(lon, lat, height),
    duration
  })
}

/** 相机飞到包围球（常用于 3DTiles / 要素） */
export function flyToBoundingSphere(
  boundingSphere: Cesium.BoundingSphere,
  duration = 2
): void {
  if (!viewer) return
  viewer.camera.flyToBoundingSphere(boundingSphere, {
    duration,
    offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-40), 0)
  })
}
