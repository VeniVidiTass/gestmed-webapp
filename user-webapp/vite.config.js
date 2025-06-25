import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
    host: true,
    allowedHosts: ['user-webapp', 'gestmed-user.127.0.0.1.nip.io'],
    watch: {
      usePolling: true
    },
    hmr: {
      port: 5174
    }
  },
  build: {
    outDir: 'dist'
  }
})
