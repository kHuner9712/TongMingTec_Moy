import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';
import { vitePreloadPlugin } from './src/plugins/vitePreloadPlugin';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const cdnUrl = env.VITE_CDN_URL || '';
  const enableSW = env.VITE_ENABLE_SW === 'true';

  return {
    base: cdnUrl ? '/' : '/',
    plugins: [
      react(),
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024,
        deleteOriginFile: false,
      }),
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
        deleteOriginFile: false,
      }),
      VitePWA({
        registerType: 'autoUpdate',
        enabled: enableSW,
        includeAssets: ['favicon.ico', 'vite.svg'],
        manifest: {
          name: 'MOY - 墨言',
          short_name: 'MOY',
          description: 'AI 原生客户管理系统',
          theme_color: '#1677ff',
          background_color: '#f0f2f5',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/cdn\.moy\.example\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'cdn-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 5,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
      vitePreloadPlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router-dom')) {
                return 'vendor';
              }
              if (id.includes('antd') || id.includes('@ant-design')) {
                if (id.includes('@ant-design/icons')) {
                  return 'antd-icons';
                }
                if (id.includes('@ant-design/pro-components')) {
                  return 'antd-pro';
                }
                return 'antd-core';
              }
              if (id.includes('react-query') || id.includes('@tanstack/react-query')) {
                return 'query';
              }
              if (id.includes('zustand')) {
                return 'state';
              }
              if (id.includes('axios') || id.includes('dayjs')) {
                return 'utils';
              }
              return 'vendor';
            }
          },
        },
      },
      splitVendorChunkPlugin: true,
      cssCodeSplit: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log'],
        },
      },
    },
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        if (cdnUrl && hostType === 'html') {
          return { relative: true };
        }
        if (cdnUrl && hostType === 'js') {
          return cdnUrl + '/' + filename;
        }
        return filename;
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'antd',
        '@ant-design/icons',
        'react-query',
        'zustand',
        'axios',
        'dayjs',
      ],
    },
  };
});
