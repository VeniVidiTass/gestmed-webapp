import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['webapp', 'gestmed.127.0.0.1.nip.io'],
    watch: {
      usePolling: true
    },
    hmr: {
      port: 5173
    },
    proxy: {
      '/api': {
        target: 'http://nginx-gateway:3000',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  define: {
    // Definisce le variabili d'ambiente per il build
    __VITE_HMR_TIMEOUT__: 60000
  }
})
