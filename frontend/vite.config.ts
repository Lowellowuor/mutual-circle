import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: '/mutual-circle/',
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            const normalized = id.replace(/\\/g, '/');
            if (normalized.includes('/node_modules/react-dom/') || normalized.includes('/node_modules/react/')) {
              return 'vendor-react';
            }
            if (normalized.includes('/node_modules/lucide-react/')) {
              return 'vendor-lucide';
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
    fs: {
      strict: false,
    },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
