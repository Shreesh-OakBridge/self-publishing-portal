import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Served at the root of its own domain (cursivepublishing.com).
  base: '/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        // Split large always-loaded vendors into their own cacheable chunks.
        // Lazy-loaded libs (xlsx, jspdf, jspdf-autotable, html2canvas) are left
        // out on purpose so they keep Vite's per-dynamic-import code-splitting
        // and only download when an admin actually exports.
        manualChunks(id) {
          const path = id.replace(/\\/g, '/');
          if (!path.includes('/node_modules/')) return;
          if (
            path.includes('/node_modules/react/') ||
            path.includes('/node_modules/react-dom/') ||
            path.includes('/node_modules/scheduler/')
          )
            return 'react-vendor';
          if (path.includes('/node_modules/@supabase/')) return 'supabase';
          if (
            path.includes('/node_modules/@tiptap/') ||
            path.includes('/node_modules/prosemirror')
          )
            return 'editor';
          if (path.includes('/node_modules/lucide-react/')) return 'icons';
        },
      },
    },
  },
});
