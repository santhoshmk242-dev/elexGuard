import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: the browser talks to http://localhost:5173 and Vite forwards /api/* to the Express server on :5000
// (same-origin from the browser's point of view, so no CORS preflight is needed locally).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
  preview: { port: 5173 },
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 900 },
});
