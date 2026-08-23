import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind to all interfaces so the Vite dev server is reachable from
    // outside the Docker container (host -> container port mapping 5173:5173).
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
});
