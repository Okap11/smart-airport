import * as Cesium from 'cesium'
import { aircraft } from '@/config'
import { createCameraFollow } from './CameraFollow'

/**
 * 创建飞机实体（工厂函数）：加载 gltf 飞机模型并飞行，支持两种控制方式：
 *  - 自动：沿 takeoffHeading 方向直线飞行，从地面爬升到巡航高度
 *  - 手动（键盘）：方向键/WASD 控制——左右转向、上下爬升/下降
 * 用位置积分 + scene.preRender 逐帧更新位置/姿态/相机。
 * 状态保存在闭包中，返回一组纯方法，无 class。
 *
 * @param {Cesium.Viewer} viewer
 * @param {object} [options] 覆盖 aircraft 配置
 */
export function createAircraft(viewer, options = {}) {
  const cfg = { ...aircraft, ...options }

  // —— 闭包内动态状态 ——
  const { lon, lat, height } = cfg.start
  const pos = { lon, lat, height } // 当前位置(度)
  let heading = Cesium.Math.toRadians(cfg.takeoffHeading ?? 45) // 航向(弧度)
  let targetHeight = cfg.cruiseHeight ?? 800 // 目标高度(m)
  let pitch = 0 // 机头俯仰(弧度)
  let roll = 0 // 机身侧倾(弧度)
  let targetPitch = 0
  let targetRoll = 0
  let manual = false // 是否手动键盘控制
  let keys = {} // 当前按下的键
  let modelEntity = null
  let removeListener = null

  const follow = createCameraFollow(viewer, {
    mode: cfg.followMode ?? 'latlon',
    distance: cfg.followDistance ?? 800,
    heightOffset: cfg.followHeightOffset ?? 300,
    pitch: cfg.followPitch ?? -20
  })

  // —— 位置/姿态 ——
  const position = () => Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.height)
  const headingRad = () => heading + Cesium.Math.toRadians(cfg.modelHeadingOffset ?? 0)
  const orientation = () =>
    Cesium.Transforms.headingPitchRollQuaternion(
      position(),
      new Cesium.HeadingPitchRoll(headingRad(), pitch, roll)
    )
  const getPosition = () => position()

  // —— 键盘事件 ——
  const onKeyDown = (e) => {
    keys[e.key] = true
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault()
    }
  }
  const onKeyUp = (e) => {
    keys[e.key] = false
  }

  // —— 加载模型并开始飞行 ——
  async function init() {
    modelEntity = viewer.entities.add({
      position: new Cesium.CallbackProperty(position, false),
      orientation: new Cesium.CallbackProperty(orientation, false),
      model: {
        uri: cfg.url,
        minimumPixelSize: cfg.minimumPixelSize ?? 0,
        maximumScale: cfg.maximumScale ?? 50000,
        scale: cfg.scale ?? 1
      }
    })
    if (cfg.manualControl) setManualControl(true)
    start()
  }

  // —— 飞行循环 + 相机跟随 ——
  function start() {
    if (removeListener || !viewer) return
    const speed = cfg.speed ?? 220
    const turnRate = cfg.turnRate ?? 1.2 // 左右转向(rad/s)
    const climbRate = cfg.climbRate ?? 150 // 爬升/下降(m/s)
    const bank = Cesium.Math.toRadians(cfg.bankAngle ?? 25) // 转向侧倾角(rad)
    const climbPitch = Cesium.Math.toRadians(cfg.climbPitchAngle ?? 12) // 俯仰角(rad)
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
        heading = Cesium.Math.toRadians(cfg.takeoffHeading ?? 45)
        targetHeight = cfg.cruiseHeight ?? 800
        // 自动起飞爬升段机头上仰，巡航恢复水平
        targetPitch = pos.height < targetHeight - 5 ? -climbPitch * 0.7 : 0
        targetRoll = 0
      }

      // 高度限制
      targetHeight = Math.max(0, Math.min(targetHeight, cfg.maxHeight ?? 5000))

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
  function setManualControl(on) {
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
  function setFollowMode(mode) {
    follow.setMode(mode)
  }

  // —— 显隐（供图层开关使用）——
  function setVisible(show) {
    if (modelEntity) modelEntity.show = show
  }

  // —— 停止飞行与跟随 ——
  function stop() {
    if (removeListener) {
      removeListener()
      removeListener = null
    }
  }

  // —— 销毁实体、监听与键盘事件 ——
  function destroy() {
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
