/**
 * 项目全局配置（纯前端学习项目，无后端）
 *
 * 两个 key 都请自行申请（免费）：
 *  - 天地图 key：https://console.tianditu.gov.cn/ 注册后创建"浏览器端"应用获取
 *  - Cesium ion token：https://ion.cesium.com/ 注册后获取默认 token
 *
 * 也可以在项目根目录创建 .env 文件覆盖：
 *   VITE_TDT_TOKEN=xxx
 *   VITE_ION_TOKEN=xxx
 */

/** 天地图底图配置 */
export const tdt = {
  token: import.meta.env.VITE_TDT_TOKEN || '',
  // 天地图服务域名
  host: 'https://t1.tianditu.gov.cn',
  // 底图图层：vec 矢量、img 影像、ter 地形晕渲
  layers: {
    vec: 'vec_w', // 矢量底图
    cva: 'cva_w', // 矢量注记
    img: 'img_w', // 影像底图
    cia: 'cia_w', // 影像注记
    ter: 'ter_w', // 地形晕渲
    cta: 'cta_w' // 地形注记
  }
}

/** Cesium ion 配置（用于加载示例 3DTiles / OSM 建筑等） */
export const ion = {
  token: import.meta.env.VITE_ION_TOKEN || ''
}

/** 3DTiles 场景配置 */
export const tileset = {
  // 方式一：Cesium ion 资产（需填 ionToken），示例用旧金山实景网格
  ionAssetId: 4691, // Aerometrex San Francisco（若 token 无该资产权限可自行更换）
  // 方式二：本地 3DTiles 目录（把 tileset.json + 瓦片放进 src/assets/cesium/tileset/）
  localUrl: '/src/assets/cesium/tileset/tileset.json',
  // 加载模式：ion | local | auto(优先 ion，无 token 或失败则 local)
  mode: 'local',
  // 加载到 ion 资产后相机飞到该位置（旧金山渔人码头附近）
  flyTo: { lon: -122.4, lat: 37.81, height: 1200 }
}

/** 飞机模型配置 */
export const aircraft = {
  // 本地 glb 模型（已随项目放置于 public 或 assets）
  url: '/models/plane.glb',
  // 起飞点（跑道/停机位），height 为起飞高度(建议 0=地面)
  start: { lon: -122.4, lat: 37.815, height: 0 },
  // 起飞/飞行方向(度，0=北，顺时针；90=东)
  takeoffHeading: 45,
  // 巡航高度(m)
  cruiseHeight: 800,
  // 飞行速度(m/s) —— 视觉速度，可调大便于观察
  speed: 220,
  // 爬升距离(m)：起飞后前进这么多米达到巡航高度
  climbDistance: 5000,
  // 相机跟随模式：latlon | enu | none
  followMode: 'latlon',
  // 模型机头朝向补偿(度)：机头若偏了调这个，通常是 90 的倍数(试 90 / -90 / 180)
  modelHeadingOffset: 90,

  // —— 手动键盘控制参数 ——
  manualControl: false, // 是否默认启用键盘控制（也可用页面开关）
  turnRate: 1.2, // 左右转向速率(rad/s)
  climbRate: 150, // 上下爬升/下降速率(m/s)
  maxHeight: 5000, // 最大飞行高度(m)
  bankAngle: 25, // 左右转向时机身侧倾角度(度)
  climbPitchAngle: 12, // 爬升/下降时机头俯仰角度(度)

  // —— 模型显示尺寸 ——
  minimumPixelSize: 0, // 0=禁用保底，按真实世界尺寸显示（不会随滚轮异常缩放）
  maximumScale: 50000, // 允许被放大到的上限倍数
  scale: 3, // 模型缩放系数

  // —— 相机跟随参数（默认后方视角，与「后」视角按钮保持一致）——
  followDistance: 800, // 相机与飞机的距离(m)，越小飞机越近越大
  followHeightOffset: 120, // 相机相对飞机的高度偏移(m)
  followPitch: -15 // 相机俯仰角(度)，负值朝下看
}
