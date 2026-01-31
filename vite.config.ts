import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
        injectRegister: 'auto',
        devOptions: {
          enabled: true
        },
        manifest: {
          id: '/',
          name: 'Spray Foam Pro Calculator',
          short_name: 'Foam Pro',
          description: 'Professional Spray Foam Estimation & Rig Management for Windows Desktop',
          theme_color: '#E30613',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'any',
          start_url: '/',
          categories: ['productivity', 'utilities', 'business'],
          screenshots: [
            {
              src: '/screenshots/desktop.png',
              sizes: '1280x800',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Dashboard View'
            },
            {
              src: '/screenshots/mobile.png',
              sizes: '390x844',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Mobile Estimation'
            }
          ],
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/icons/icon-maskable-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/icons/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'tailwind-cdn-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
              }
            },
            {
              urlPattern: /^https:\/\/esm\.sh\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'esm-cdn-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 }
              }
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
