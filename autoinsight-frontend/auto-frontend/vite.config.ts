import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  server: {
    allowedHosts: [
    'orbitsolutions.tail211622.ts.net','casio-plugins-started-classes.trycloudflare.com'
  ],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
    },
  },
  
})
