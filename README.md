# 智慧机场三维可视化（Smart Airport 3D）

> 基于 **Vue3 + Pinia + Cesium + Ant Design Vue + ECharts + Vite** 的前端学习项目。
> 纯前端、无后端，演示「Cesium 加载 gltf 飞机 + 3DTiles 场景 + 相机跟随 + 键盘控制」等核心能力。

![Vue3](https://img.shields.io/badge/Vue-3.5-blue) ![Cesium](https://img.shields.io/badge/Cesium-1.146-green) ![Vite](https://img.shields.io/badge/Vite-6-purple) ![Pinia](https://img.shields.io/badge/Pinia-4-yellow) ![ECharts](https://img.shields.io/badge/ECharts-6-orange)

---

## ✨ 功能特性

### 三维场景
- 🌍 **天地图影像底图**：WMTS 影像 + 注记（未配置 key 时自动兜底 OpenStreetMap）
- 🏢 **3DTiles 场景**：支持 `ion`（Cesium ion 资产）/ `local`（本地瓦片）/ `auto` 三种模式
- ✈️ **gltf 飞机模型**：波音 747-400 客机模型
- 🎥 **相机跟随**：三种模式
  - `经纬度跟随`：简化相对偏移，远距离观察
  - `ENU 精确跟随`：基于东-北-天局部坐标，近距姿态贴合跟拍
  - `关闭跟随`：自由操作相机
- 🎛️ **图层控制**：底图 / 注记 / 3DTiles / 飞机 显隐开关（Pinia 状态驱动）
- 📊 **ECharts 大屏**：航班趋势、旅客吞吐、机位占用、告警分布（mock 数据）

### 飞机控制（本轮新增）
- 🕹️ **键盘手动控制**：开启开关后，用方向键 / WASD 控制飞机
  - `W / ↑` 爬升 · `S / ↓` 下降 · `A / ←` 左转 · `D / →` 右转（支持多键同按）
- ✈️ **真实姿态**：转向时机身侧倾、爬升/下降时机头俯仰，平滑过渡
- 🔄 **自动飞行**：关闭键盘控制后，从地面起飞 → 爬升 → 直线巡航
- 🎯 **预设视角**：围绕飞机切换 **前 / 后 / 左 / 右** 视角（相对飞机航向，持续跟随），默认后方
- 🛫 **起飞轨迹**：沿起飞方向从地面爬升至巡航高度，后直线巡航

---

## 🚀 快速开始

```bash
# 安装依赖（.npmrc 已指定官方 npm 源）
npm install

# 启动开发
npm run dev

# 生产构建
npm run build && npm run preview
```

浏览器打开 `http://localhost:5173`，默认进入总览大屏，点「进入三维场景」查看 Cesium 场景。

> ⚠️ 修改 `.env` 后需**重启 dev** 才会生效。

---

## ⚙️ 环境变量配置（两个 Key 均为免费申请）

| 配置 | 用途 | 申请地址 |
|---|---|---|
| 天地图 Key | 加载天地图影像底图 | https://console.tianditu.gov.cn/ |
| Cesium ion Token | 加载 ion 示例 3DTiles | https://ion.cesium.com/ |

**项目根目录创建 `.env`**（推荐，`.env` 已被 gitignore 排除，不会上传）：

```ini
VITE_TDT_TOKEN=你的天地图key
VITE_ION_TOKEN=你的iontoken
```

> 参考模板见 `.env.example`。兜底逻辑：无天地图 key 时自动切换 OpenStreetMap。

### 其他配置（`src/config/index.js`）

**飞机（`aircraft`）**

| 字段 | 说明 | 默认 |
|---|---|---|
| `start` | 起飞点（经纬度 + 地面高度） | `{-122.4, 37.815, 0}` |
| `takeoffHeading` | 起飞方向(度，0=北顺时针) | `45` |
| `cruiseHeight` | 巡航高度(m) | `800` |
| `speed` | 飞行速度(m/s) | `220` |
| `modelHeadingOffset` | 机头朝向补偿(度，90 的倍数) | `90` |
| `scale` | 模型缩放 | `3` |
| `turnRate` | 键盘转向灵敏度(rad/s) | `1.2` |
| `climbRate` | 爬升/下降速率(m/s) | `150` |
| `bankAngle` | 转向侧倾角(度) | `25` |
| `climbPitchAngle` | 俯仰角(度) | `12` |

**3DTiles（`tileset`）**

| 字段 | 说明 | 默认 |
|---|---|---|
| `mode` | `ion` / `local` / `auto` | `local` |
| `ionAssetId` | Cesium ion 资产 ID | `4691`（旧金山实景网格） |
| `localUrl` | 本地 3DTiles 入口 | `src/assets/cesium/tileset/tileset.json` |

> 本地 3DTiles：把倾斜摄影/建模转换后的 `tileset.json` + 瓦片放进 `src/assets/cesium/tileset/`，并设 `mode: 'local'`。

---

## 🕹️ 键盘控制 & 视角（操作说明）

页面顶部工具栏：

- **相机跟随**：`经纬度跟随` / `ENU 精确跟随` / `关闭跟随`（单选，切 radio 会复位视角到后方）
- **视角**：`前 / 后 / 左 / 右`（单选，默认 `后`，相对飞机航向持续跟随）
- **键盘控制**：开关（默认关闭）

开启「键盘控制」后，在页面上用：

| 按键 | 作用 |
|---|---|
| `W / ↑` | 爬升 |
| `S / ↓` | 下降 |
| `A / ←` | 左转 |
| `D / →` | 右转 |

支持多键同按（如 `W + A` 边爬升边左转），松开即回平。

---

## 📁 目录结构

```
smart-airport/
├── .github/workflows/
│   └── deploy.yml                   # GitHub Actions：自动构建 + 部署 GitHub Pages
├── public/models/plane.glb          # 飞机模型（波音 747-400）
├── src/
│   ├── api/mock.js                  # 数据层：mock 接口（无后端）
│   ├── components/
│   │   ├── 3d/
│   │   │   ├── CesiumViewer.vue     # 场景容器：初始化 viewer + 装配图层/飞机/视角
│   │   │   ├── layers/
│   │   │   │   ├── BaseLayer.js     # 天地图底图 + 注记（含兜底 OSM）
│   │   │   │   └── TilesetLayer.js  # 3DTiles 加载（ion/local/auto）
│   │   │   ├── entity/
│   │   │   │   ├── AircraftEntity.js  # 飞机工厂函数：飞行/键盘控制/姿态
│   │   │   │   └── CameraFollow.js    # 相机跟随工厂函数（latlon/enu/视角预设）
│   │   └── ChartPanel.vue           # ECharts 轻量封装
│   ├── config/index.js              # 全局配置（天地图/ion/tileset/aircraft）
│   ├── hooks/useCesium.js           # Viewer 初始化/销毁/坐标工具（单例）
│   ├── router/index.js              # 路由：总览大屏 / 三维场景
│   ├── stores/use3dStore.js         # 三维状态：加载状态/图层开关/跟随模式/键盘控制
│   └── views/
│       ├── Dashboard.vue            # 总览大屏（ECharts + 统计）
│       └── Scene.vue                # 三维场景（工具栏 + 图层面板 + 图表）
├── vite.config.js                   # vite-plugin-cesium 处理 Cesium 静态资源
├── .env.example                     # 环境变量模板（提交）
├── .env                             # 本地 Key（gitignore，不提交）
└── .npmrc                           # 指定官方 npm registry
```

> 代码风格：三维实体采用**工厂函数 + 闭包 + 箭头函数**（无 class），状态封在闭包内，返回一组纯方法。

---

## 🛠 技术要点

### Cesium + Vite 集成
使用 `vite-plugin-cesium` 自动处理 Cesium 的**静态资源、worker、CSS、global**，无需手动拷贝文件、配置 worker 路径，避免「Cesium 在 Vite 里跑不起来」的常见问题。

### 相机跟随实现
`CameraFollow.js`（工厂函数）在 `scene.preRender` 回调中逐帧根据飞机位置/航向更新相机：
- 默认后方跟随：`lookAt(target, HPR(heading - π/2, pitch, distance))` 保证飞机居中（修正了 Cesium 相机方位的 -90° 偏移）
- 视角预设：设置 `override = { relHeading, pitch, distance }`，相机以**相对飞机航向**的方位持续跟随，飞机转向时视角自动跟随

### 飞机飞行
`AircraftEntity.js`（工厂函数）用 `CallbackProperty` 动态计算位置/朝向：
- **位置积分**：每帧按当前航向推进经纬度 + 高度平滑逼近目标高度（起飞爬升由高度逼近实现）
- **键盘控制**：`window` 监听按键，`preRender` 里按 `turnRate/climbRate` 改变航向与目标高度
- **姿态**：转向设置 `roll`、升降设置 `pitch`，每帧平滑逼近目标角度
- **帧间隔**：用 `performance.now()` 自算，避免 `clock.deltaTime` 首帧为 `undefined` 导致的 NaN

---

## 🤖 CI/CD & GitHub Pages（在线预览）

`.github/workflows/deploy.yml`：push 到 `main` 自动执行

```
npm ci → 用 Secrets 生成 .env → npm run build（注入 GH_BASE）→ 部署 GitHub Pages
```

### 仓库一次性配置
1. **Settings → Pages** → Source 选「**GitHub Actions**」
2. **Settings → Secrets and variables → Actions**，添加两个 Repository secret：
   - `VITE_TDT_TOKEN` = 天地图 key
   - `VITE_ION_TOKEN` = Cesium ion token

### 为什么 Key 安全
- `.gitignore` 已排除 `.env` 和 `.env.*`（仅保留 `.env.example`），Key **不会上传**
- CI 里由 **Secrets** 临时生成 `.env`，构建后即丢弃，Key 不落入产物之外的任何位置
- `vite.config.js` 用 `base: process.env.GH_BASE || '/'`：本地根路径，GitHub 子路径 `/仓库名/` 自动识别

预览地址：`https://<用户名>.github.io/<仓库名>/`

---

## 📦 模型来源

- **飞机模型** `public/models/plane.glb`：波音 747-400（`b744.glb`），来自开源模型库
  [Flightradar24/fr24-3d-models](https://github.com/Flightradar24/fr24-3d-models)（glTF，GPLv2，学习演示用）
- **3DTiles 场景**：可从 Cesium ion 加载示例实景网格，或放入本地倾斜摄影转换的瓦片

---

## ⚠️ 说明

- 本项目的航班/吞吐量/告警等数据均为 **mock 演示数据**；接入真实数据时替换 `src/api/mock.js` 即可，视图层无需改动
- 倾斜摄影实景、BIM、机位/跑道矢量等真实机场数据需另行获取（自建倾斜摄影、购买数据，或参考公共平台如日本 PLATEAU 的城市 3DTiles）
- 在线底图放大大致丢影像：瓦片最大层级约 18–19 级，属数据硬限制；要看更细需 3DTiles 或更高分辨率影像

---

## 🗺 Roadmap（可选方向）

- [ ] 接入真实航班数据（实时 API / WebSocket）
- [ ] 机场 3DTiles 倾斜摄影实景 + 机位/跑道标注
- [ ] 测量、剖切、漫游等三维工具
- [ ] 告警联动、轨迹回放、粒子特效

## 📄 License

本项目代码仅供**学习演示**使用。模型与 3DTiles 资源遵循各自原始授权（GPLv2 / 平台条款）。
