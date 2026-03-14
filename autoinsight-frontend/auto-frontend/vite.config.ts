import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/og-image': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api/search': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/api/search/stream': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/api/health': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/api/vehicle-types': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
