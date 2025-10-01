import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import Cpu from './pages/cpu.vue'
import GPU from './pages/gpu.vue'
import { createRouter, createWebHistory } from 'vue-router'
import vlm from './pages/vlm.vue'
import vlm_c from './pages/vlm_cpu.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', name: 'Home', component: GPU },
      { path: '/cpu', name: 'Cpu', component: Cpu }, 
      { path:'/vlm', name:'vlm', component: vlm },
    { path:'/vlmc', name:'vlmc', component: vlm_c}]         
  })
 
  const app = createApp(App)
  app.use(router)
  
  
  router.isReady().then(() => {
    app.mount('#app')
  })
