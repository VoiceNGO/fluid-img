import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        renderer: resolve(__dirname, 'src/renderer/renderer/renderer.ts'),
        react: resolve(__dirname, 'src/renderer/react/react.tsx'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash][extname]',
      },
      external: ['react', 'react-dom'],
    },
    sourcemap: true,
    minify: 'esbuild',
  },
});
