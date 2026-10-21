import * as Cesium from 'cesium'
import { tdt } from '@/config'

/**
 * 底图图层：加载天地图影像 + 注记。
 * 天地图 Web 服务需要 tk key（免费申请），未配置时兜底到 OpenStreetMap 保证能跑。
 * 直接使用 addImageryProvider(provider)，避免 ImageryLayer.fromProviderAsync
 * 在 Cesium 1.146 下返回的 layer.provider 为空的问题。
 */

/** 加载影像底图的结果 */
export interface ImageryResult {
  base: Cesium.ImageryLayer
  annotation: Cesium.ImageryLayer | null
}

/** 天地图 WMTS 请求模板（XYZ 风格） */
function tdtUrl(layer: string, tk: string): string {
  return `${tdt.host}/${layer}/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer.slice(0, 3)}&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tk}`
}

/**
 * 加载影像底图
 * @param viewer
 */
export function loadImagery(viewer: Cesium.Viewer): ImageryResult {
  const imageryLayers = viewer.imageryLayers
  const tk = tdt.token

  // 先清空可能存在的默认图层
  imageryLayers.removeAll()

  if (tk) {
    // 天地图影像底图 + 影像注记（maximumLevel 提高以支持更深放大）
    const base = imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: tdtUrl(tdt.layers.img, tk),
        maximumLevel: 19
      })
    )
    const annotation = imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: tdtUrl(tdt.layers.cia, tk),
        maximumLevel: 19
      })
    )
    return { base, annotation }
  }

  // 兜底：OpenStreetMap（无需 key）
  const base = imageryLayers.addImageryProvider(
    new Cesium.UrlTemplateImageryProvider({
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      maximumLevel: 19
    })
  )
  return { base, annotation: null }
}
