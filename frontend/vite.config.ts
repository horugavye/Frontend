import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { config } from 'dotenv'

config()

const fallbackApiUrl = 'https://fallback-api.example.com' // Replace with your default backend
const targetApiUrl = process.env.VITE_API_URL || fallbackApiUrl

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
  server: {
    proxy: {
      '/api': {
        target: targetApiUrl,
        changeOrigin: true,
        secure: false,
      }
    }
  }
})