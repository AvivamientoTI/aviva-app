/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  server: {
    host: '127.0.0.1',
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('@mantine') || id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'frameworks';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            if (id.includes('dayjs') || id.includes('html-to-image') || id.includes('react-big-calendar')) {
              return 'utils';
            }
          }
        }
      }
    }
  }
})
