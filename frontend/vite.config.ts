import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/judicial-delay-analytics/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'd3-bundle': ['d3'],
          'recharts-bundle': ['recharts'],
          'leaflet-bundle': ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
})
