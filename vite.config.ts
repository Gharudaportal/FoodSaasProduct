import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'admin', dest: '' },
        { src: 'data', dest: '' },
        { src: 'js', dest: '' },
        { src: 'css', dest: '' },
        { src: 'images', dest: '' },
        { src: '*.html', dest: '' },
      ],
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
