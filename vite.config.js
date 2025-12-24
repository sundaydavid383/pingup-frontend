import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// Backend API and images
const API_URL_PATTERN = /^https:\/\/pingup-zwit\.onrender\.com\/api\/.*$/;
const IMAGE_URL_PATTERN = /^https:\/\/pingup-zwit\.onrender\.com\/images\/.*$/;

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        'icons/icon-192.png',
        'icons/icon-512.png'
      ],

      manifest: {
        name: 'SpringsConnect',
        short_name: 'Springs',
        description: 'Connect, grow spiritually, and walk daily in faith',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f3f0f0ff',
        theme_color: '#1e40af',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },

      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB

        runtimeCaching: [
          // SPA pages
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'pages', networkTimeoutSeconds: 5 }
          },
          // API responses
          {
            urlPattern: API_URL_PATTERN,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', networkTimeoutSeconds: 5 }
          },
          // Images
          {
            urlPattern: IMAGE_URL_PATTERN,
            handler: 'CacheFirst',
            options: { cacheName: 'image-cache' }
          }
        ]
      }
    })
  ]
});
