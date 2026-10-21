import * as Cesium from 'cesium'
import { tileset, ion } from '@/config'
import type { TilesetConfig } from '@/config'
import { flyToBoundingSphere } from '@/hooks/useCesium'

/**
 * 3DTiles 场景图层。
 * 支持三种加载来源：
 *  - ion：从 Cesium ion 资产加载（需填 ionToken）
 *  - local：从本地 tileset.json 加载（把瓦片放进 src/assets/cesium/tileset/）
 *  - auto：优先 ion，无 token 则 local
 */

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

/**
 * 加载 3DTiles 并飞至包围球
 * @param viewer
 * @param options 覆盖 tileset 配置
 * @returns 加载成功返回 tileset，失败返回 null
 */
export async function loadTileset(
  viewer: Cesium.Viewer,
  options: Partial<TilesetConfig> = {}
): Promise<Cesium.Cesium3DTileset | null> {
  const cfg: TilesetConfig = { ...tileset, ...options }
  let tilesetObj: Cesium.Cesium3DTileset | null = null

  const canIon = cfg.mode === 'ion' || (cfg.mode === 'auto' && !!ion.token)
  const canLocal = cfg.mode === 'local' || cfg.mode === 'auto'

  if (canIon) {
    try {
      tilesetObj = await Cesium.Cesium3DTileset.fromIonAssetId(cfg.ionAssetId)
    } catch (e) {
      console.warn('[TilesetLayer] ion 资产加载失败，尝试本地', errMsg(e))
      if (cfg.mode === 'ion') return null
    }
  }

  if (!tilesetObj && canLocal) {
    try {
      tilesetObj = await Cesium.Cesium3DTileset.fromUrl(cfg.localUrl)
    } catch (e) {
      console.warn('[TilesetLayer] 本地 tileset 加载失败（可能尚未放置数据）', errMsg(e))
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
    // 等待 tileset 就绪后计算包围球（readyEvent 在部分类型定义中缺失，做兼容断言）
    const tilesetWithReady = loadedTileset as unknown as {
      readyEvent: { addEventListener(cb: () => void): void }
    }
    tilesetWithReady.readyEvent.addEventListener(() => {
      try {
        flyToBoundingSphere(loadedTileset.boundingSphere, 2)
      } catch {
        /* 忽略包围球计算失败 */
      }
    })
  }

  return loadedTileset
}

/** 卸载 3DTiles */
export function removeTileset(
  viewer: Cesium.Viewer,
  tilesetObj: Cesium.Cesium3DTileset | null
): void {
  if (viewer && tilesetObj) {
    viewer.scene.primitives.remove(tilesetObj)
  }
}
