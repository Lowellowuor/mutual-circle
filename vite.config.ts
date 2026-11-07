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
            // Vite 8 uses Rolldown, which requires function form.
            // Object form ({ 'name': [...] }) is Rollup 4 / Vite 5 syntax
            // and throws "manualChunks is not a function" at build time.
            // Normalize to forward slashes to handle Windows paths.
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
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
