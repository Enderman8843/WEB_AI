import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(),
    routes: []         
  })
  
  const app = createApp(App)
  app.use(router)
  
  
  router.isReady().then(() => {
    app.mount('#app')
  })
