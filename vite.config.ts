import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NgmiPolyfill } from 'vite-plugin-ngmi-polyfill';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [NgmiPolyfill(), react()],
  resolve: {
    alias: {
      '@': './src',
    },
  },
});
