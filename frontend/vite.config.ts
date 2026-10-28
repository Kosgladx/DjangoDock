import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import os from 'os'

// Store Vite cache in the system temp dir to avoid OneDrive I/O issues
const cacheDir = path.join(os.tmpdir(), 'vite-eduschedule-cache')

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  cacheDir,
  server: {
    port: 5173,
    watch: {
      // Use polling to avoid issues with OneDrive virtual filesystem
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  },
  optimizeDeps: {
    // Force Vite to pre-bundle on start, avoiding mid-session freezes
    force: false,
  }
})