import * as Cesium from 'cesium'

/**
 * 创建相机跟随器（工厂函数）：实现两种跟随飞机的方式。
 *  - latlon：基于经纬度 + 高度做固定相对偏移（简化，远距离观察，跟随平滑但无姿态贴合）
 *  - enu   ：基于东-北-天(ENU)局部坐标系，相机置于目标后上方并保持飞行航向（近距跟拍，姿态精确）
 *  - none  ：关闭跟随
 * 另支持视角预设（override）：以相对飞机航向的方位/俯仰/距离持续跟随。
 * 用法：在 scene.preRender 回调里每帧调用 update(targetPosition, heading)。
 *
 * @param {Cesium.Viewer} viewer
 * @param {object} [options]
 * @param {string} [options.mode='latlon'] 跟随模式 latlon | enu | none
 * @param {number} [options.distance] 相机与目标的距离(米)
 * @param {number} [options.heightOffset] 相机相对目标的高度偏移(米)
 */
export function createCameraFollow(viewer, options = {}) {
  let mode = options.mode ?? 'latlon'
  const distance = options.distance ?? 800
  const heightOffset = options.heightOffset ?? 300
  const pitch = options.pitch ?? -20 // 相机俯仰角(度)，负值朝下看
  let override = null // 视角预设：{ relHeading(rad, 相对飞机航向), pitch(rad), distance }

  /** 切换跟随模式，并复位视角预设回默认后方跟拍 */
  const setMode = (m) => {
    mode = m
    override = null
  }

  /** 设置跟随视角预设：相机围绕目标以相对飞机航向的方位持续跟随 */
  const setViewPreset = ({ relHeading, pitch: p, distance: d }) => {
    override = { relHeading, pitch: p, distance: d }
  }

  /** 以视角预设跟随：相机相对飞机航向保持指定方位/俯仰/距离 */
  const followOverride = (target, heading) => {
    if (!target) return
    viewer.camera.lookAt(
      target,
      new Cesium.HeadingPitchRange(
        heading + override.relHeading,
        override.pitch,
        override.distance
      )
    )
  }

  /** 默认后方跟拍（latlon/enu 共用）：相机在飞机正后方，视线指向飞机 → 飞机居中 */
  const followBack = (target, heading) => {
    // heading - π/2 为修正 -90° 偏移后的正后方方位（与视角预设「后」一致）
    viewer.camera.lookAt(
      target,
      new Cesium.HeadingPitchRange(
        heading - Math.PI / 2,
        Cesium.Math.toRadians(pitch),
        distance
      )
    )
  }

  /** 每帧调用 */
  const update = (target, heading) => {
    if (mode === 'none' || !viewer) return
    if (override) {
      followOverride(target, heading)
      return
    }
    followBack(target, heading)
  }

  return { setMode, setViewPreset, update }
}
