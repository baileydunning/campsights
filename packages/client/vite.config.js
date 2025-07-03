import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: 'gzip' }),
    viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
    visualizer({
      filename: 'dist/bundle-stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
  optimizeDeps: {
    include: ['react','react-dom','leaflet','react-leaflet'],
    esbuildOptions: { drop: ['console','debugger'] },
  },
  build: {
    target: 'esnext',
    sourcemap: false,
    minify: 'esbuild',
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true },
    },
    assetsInlineLimit: 4096,
    rollupOptions: {
      external: [
        'leaflet/dist/leaflet-src.js'
      ],
      output: {
        manualChunks: {
          react: ['react','react-dom'],
          leaflet: ['leaflet','react-leaflet'],
        }
      }
    }
  }
})
