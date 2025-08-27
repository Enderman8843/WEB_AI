import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue() ],
  server: {
    host: true,  // makes Vite listen on all network interfaces
    allowedHosts: [
      '.ngrok-free.app'  // allow any ngrok subdomain
    ]
  }
})
  
