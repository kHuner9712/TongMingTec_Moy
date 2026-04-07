import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import path from 'path';

export default defineConfig({
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
});
