
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: 'gzip' }),
    visualizer({
      filename: 'dist/bundle-stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      // Registered by hand in src/pwa.ts so it can be skipped on localhost.
      injectRegister: false,
      includeAssets: ['tent.png', 'tent-192.png'],
      manifest: {
        id: '/',
        name: 'Campsights',
        short_name: 'Campsights',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#F7F5F0',
        theme_color: '#F7F5F0',
        categories: ['travel', 'navigation', 'sports'],
        description: 'Find dispersed campsites on BLM public land, with weather, elevation, land ownership and wildfire layers.',
        icons: [
          {
            src: 'tent-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'tent.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,json}'],
        runtimeCaching: [],
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html'
      }
    })
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
      treeshake: true,
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
