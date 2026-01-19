import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Dev: Vite serves the UI; API requests are proxied to the Node server.
// Prod: the Node server serves the built UI and the API from the same origin.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/output': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
