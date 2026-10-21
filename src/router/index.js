import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '总览大屏' }
  },
  {
    path: '/scene',
    name: 'Scene',
    component: () => import('@/views/Scene.vue'),
    meta: { title: '机场三维场景' }
  }
]

const router = createRouter({
  // hash 模式：兼容 GitHub Pages 子路径部署，刷新深层路由不 404
  history: createWebHashHistory(),
  routes
})

router.afterEach((to) => {
  if (to.meta?.title) document.title = `${to.meta.title} · 智慧机场`
})

export default router
