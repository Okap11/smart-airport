import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  // 用相对 base：资源引用相对路径，兼容 GitHub Pages 子路径部署（/仓库名/）
  // 也兼容本地 dev。勿再改回绝对子路径，否则 cesium 静态资源会 404。
  base: './',
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
