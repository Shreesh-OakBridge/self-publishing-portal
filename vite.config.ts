import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Served under oakbridge.in/cursive — assets + links resolve under this base.
  base: '/cursive/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
