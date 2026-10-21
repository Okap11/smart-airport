import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages 部署在子路径 /<仓库名>/ 下；本地构建用根路径。
  // CI 里通过 GH_BASE 环境变量注入（见 .github/workflows/deploy.yml）
  base: process.env.GH_BASE || '/',
  plugins: [
    vue(),
    // 自动处理 Cesium 的静态资源、worker、css、global 引入，无需手动拷贝
    cesium()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: true,
    port: 5173,
    open: true
  },
  build: {
    // cesium + echarts + antdv 包体积大，放开 chunk 警告阈值
    chunkSizeWarningLimit: 1500,
    sourcemap: false
  }
})
