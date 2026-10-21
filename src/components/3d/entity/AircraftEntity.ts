import * as Cesium from 'cesium'
import { aircraft } from '@/config'
import type { AircraftConfig } from '@/config'
import { createCameraFollow } from './CameraFollow'
import type { CameraFollow } from './CameraFollow'

/**
 * 创建飞机实体（工厂函数）：加载 gltf 飞机模型并飞行，支持两种控制方式：
 *  - 自动：沿 takeoffHeading 方向直线飞行，从地面爬升到巡航高度
 *  - 手动（键盘）：方向键/WASD 控制——左右转向、上下爬升/下降
 * 用位置积分 + scene.preRender 逐帧更新位置/姿态/相机。
 * 状态保存在闭包中，返回一组纯方法，无 class。
 */

/** 动态位置（度） */
interface Position {
  lon: number
  lat: number
  height: number
}

/** 飞机实体对外接口 */
export interface Aircraft {
  init(): Promise<void>
  start(): void
  stop(): void
  setManualControl(on: boolean): void
  setFollowMode(mode: AircraftConfig['followMode']): void
  setVisible(show: boolean): void
  destroy(): void
  getPosition(): Cesium.Cartesian3
  follow: CameraFollow
}

/**
 * 创建飞机实体
 * @param viewer
 * @param options 覆盖 aircraft 配置
 */
export function createAircraft(
  viewer: Cesium.Viewer,
  options: Partial<AircraftConfig> = {}
): Aircraft {
  const cfg: AircraftConfig = { ...aircraft, ...options }

  // —— 闭包内动态状态 ——
  const { lon, lat, height } = cfg.start
  const pos: Position = { lon, lat, height } // 当前位置(度)
  let heading = Cesium.Math.toRadians(cfg.takeoffHeading) // 航向(弧度)
  let targetHeight = cfg.cruiseHeight // 目标高度(m)
  let pitch = 0 // 机头俯仰(弧度)
  let roll = 0 // 机身侧倾(弧度)
  let targetPitch = 0
  let targetRoll = 0
  let manual = false // 是否手动键盘控制
  let keys: Record<string, boolean> = {} // 当前按下的键
  let modelEntity: Cesium.Entity | null = null
  let removeListener: (() => void) | null = null

  const follow = createCameraFollow(viewer, {
    mode: cfg.followMode,
    distance: cfg.followDistance,
    heightOffset: cfg.followHeightOffset,
    pitch: cfg.followPitch
  })

  // —— 位置/姿态 ——
  const position = (): Cesium.Cartesian3 =>
    Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.height)
  const headingRad = (): number =>
    heading + Cesium.Math.toRadians(cfg.modelHeadingOffset)
  const orientation = (): Cesium.Quaternion =>
    Cesium.Transforms.headingPitchRollQuaternion(
      position(),
      new Cesium.HeadingPitchRoll(headingRad(), pitch, roll)
    )
  const getPosition = (): Cesium.Cartesian3 => position()

  // —— 键盘事件 ——
  const onKeyDown = (e: KeyboardEvent): void => {
    keys[e.key] = true
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault()
    }
  }
  const onKeyUp = (e: KeyboardEvent): void => {
    keys[e.key] = false
  }

  // —— 加载模型并开始飞行 ——
  async function init(): Promise<void> {
    modelEntity = viewer.entities.add({
      position: new Cesium.CallbackProperty(
        position,
        false
      ) as unknown as Cesium.PositionProperty,
      orientation: new Cesium.CallbackProperty(orientation, false),
      model: {
        uri: cfg.url,
        minimumPixelSize: cfg.minimumPixelSize,
        maximumScale: cfg.maximumScale,
        scale: cfg.scale
      }
    })
    if (cfg.manualControl) setManualControl(true)
    start()
  }

  // —— 飞行循环 + 相机跟随 ——
  function start(): void {
    if (removeListener) return
    const speed = cfg.speed
    const turnRate = cfg.turnRate // 左右转向(rad/s)
    const climbRate = cfg.climbRate // 爬升/下降(m/s)
    const bank = Cesium.Math.toRadians(cfg.bankAngle) // 转向侧倾角(rad)
    const climbPitch = Cesium.Math.toRadians(cfg.climbPitchAngle) // 俯仰角(rad)
    const R = 6378137 // 地球平均半径
    let lastTime = performance.now()

    removeListener = viewer.scene.preRender.addEventListener(() => {
      const now = performance.now()
      let dt = (now - lastTime) / 1000
      lastTime = now
      if (!Number.isFinite(dt) || dt < 0) dt = 0
      dt = Math.min(dt, 0.1)

      if (manual) {
        // 键盘控制：左右转向 / 上下爬升下降
        const left = keys['ArrowLeft'] || keys['a'] || keys['A']
        const right = keys['ArrowRight'] || keys['d'] || keys['D']
        const up = keys['ArrowUp'] || keys['w'] || keys['W']
        const down = keys['ArrowDown'] || keys['s'] || keys['S']
        if (left) heading -= turnRate * dt
        if (right) heading += turnRate * dt
        if (up) targetHeight += climbRate * dt
        if (down) targetHeight -= climbRate * dt
        // 姿态目标：转向时侧倾，升降时俯仰（Cesium 中 pitch 负=上仰，roll 正=左倾）
        targetRoll = (right ? -bank : 0) + (left ? bank : 0)
        targetPitch = (up ? -climbPitch : 0) + (down ? climbPitch : 0)
      } else {
        // 自动：保持起飞方向、目标巡航高度
        heading = Cesium.Math.toRadians(cfg.takeoffHeading)
        targetHeight = cfg.cruiseHeight
        // 自动起飞爬升段机头上仰，巡航恢复水平
        targetPitch = pos.height < targetHeight - 5 ? -climbPitch * 0.7 : 0
        targetRoll = 0
      }

      // 高度限制
      targetHeight = Math.max(0, Math.min(targetHeight, cfg.maxHeight))

      // 位置沿航向移动，高度平滑逼近目标高度（自动起飞爬升由此实现）
      const cosLat = Math.cos(Cesium.Math.toRadians(pos.lat))
      const dLat = (speed * dt * Math.cos(heading)) / R // 北向位移
      const dLon = (speed * dt * Math.sin(heading)) / (R * cosLat) // 东向位移
      pos.lat += Cesium.Math.toDegrees(dLat)
      pos.lon += Cesium.Math.toDegrees(dLon)
      pos.height += (targetHeight - pos.height) * Math.min(dt * 1.5, 1)

      // 姿态平滑逼近目标
      const poseRate = Math.min(dt * 3, 1)
      roll += (targetRoll - roll) * poseRate
      pitch += (targetPitch - pitch) * poseRate

      follow.update(position(), headingRad())
    })
  }

  // —— 手动控制开关 ——
  function setManualControl(on: boolean): void {
    manual = on
    if (on) {
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
    } else {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      keys = {}
    }
  }

  // —— 相机跟随模式 latlon | enu | none ——
  function setFollowMode(mode: AircraftConfig['followMode']): void {
    follow.setMode(mode)
  }

  // —— 显隐（供图层开关使用）——
  function setVisible(show: boolean): void {
    if (modelEntity) modelEntity.show = show
  }

  // —— 停止飞行与跟随 ——
  function stop(): void {
    if (removeListener) {
      removeListener()
      removeListener = null
    }
  }

  // —— 销毁实体、监听与键盘事件 ——
  function destroy(): void {
    setManualControl(false)
    stop()
    if (modelEntity) {
      viewer.entities.remove(modelEntity)
      modelEntity = null
    }
  }

  return {
    init,
    start,
    stop,
    setManualControl,
    setFollowMode,
    setVisible,
    destroy,
    getPosition,
    follow
  }
}
