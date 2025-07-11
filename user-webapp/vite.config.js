import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
    host: true,
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
