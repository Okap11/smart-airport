import * as Cesium from 'cesium'
import { tileset, ion } from '@/config'
import { flyToBoundingSphere } from '@/hooks/useCesium'

/**
 * 3DTiles 场景图层。
 * 支持三种加载来源：
 *  - ion：从 Cesium ion 资产加载（需填 ionToken）
 *  - local：从本地 tileset.json 加载（把瓦片放进 src/assets/cesium/tileset/）
 *  - auto：优先 ion，无 token 则 local
 */

/**
 * 加载 3DTiles 并飞至包围球
 * @param {Cesium.Viewer} viewer
 * @param {object} [options] 覆盖 tileset 配置
 * @returns {Promise<Cesium.Cesium3DTileset|null>}
 */
export async function loadTileset(viewer, options = {}) {
  const cfg = { ...tileset, ...options }
  let tilesetObj = null

  const canIon = cfg.mode === 'ion' || (cfg.mode === 'auto' && ion.token)
  const canLocal = cfg.mode === 'local' || (cfg.mode === 'auto')

  if (canIon) {
    try {
      tilesetObj = await Cesium.Cesium3DTileset.fromIonAssetId(cfg.ionAssetId)
    } catch (e) {
      console.warn('[TilesetLayer] ion 资产加载失败，尝试本地', e.message)
      if (cfg.mode === 'ion') return null
    }
  }

  if (!tilesetObj && canLocal) {
    try {
      tilesetObj = await Cesium.Cesium3DTileset.fromUrl(cfg.localUrl)
    } catch (e) {
      console.warn('[TilesetLayer] 本地 tileset 加载失败（可能尚未放置数据）', e.message)
      return null
    }
  }

  if (!tilesetObj) return null

  const loadedTileset = viewer.scene.primitives.add(tilesetObj)

  // 初始视角：有配置 flyTo 用配置，否则飞到包围球
  if (cfg.flyTo?.lon !== undefined) {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        cfg.flyTo.lon,
        cfg.flyTo.lat,
        cfg.flyTo.height ?? 1200
      ),
      duration: 2
    })
  } else {
    // 等待 tileset 就绪后计算包围球
    loadedTileset.readyEvent.addEventListener(() => {
      try {
        flyToBoundingSphere(loadedTileset.boundingSphere, 2)
      } catch (_) {}
    })
  }

  return loadedTileset
}

/** 卸载 3DTiles */
export function removeTileset(viewer, tilesetObj) {
  if (viewer && tilesetObj) {
    viewer.scene.primitives.remove(tilesetObj)
  }
}
