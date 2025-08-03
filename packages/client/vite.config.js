
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
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['tent.png', 'tent-192.png'],
      manifest: {
        name: 'Campsights',
        short_name: 'Campsights',
        start_url: '.',
        display: 'standalone',
        background_color: '#F1EFE9',
        theme_color: '#F1EFE9',
        description: 'Discover and share campsites!',
        icons: [
          {
            src: 'tent-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'tent.png',
            sizes: '512x512',
            type: 'image/png'
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
