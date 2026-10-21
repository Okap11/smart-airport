import { createRouter, createWebHistory } from 'vue-router'

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
  history: createWebHistory(),
  routes
})

router.afterEach((to) => {
  if (to.meta?.title) document.title = `${to.meta.title} · 智慧机场`
})

export default router
