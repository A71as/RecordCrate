import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    strictPort: true,
    host: '127.0.0.1'
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and related libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Vendor chunk for UI libraries
          'vendor-ui': ['html-to-image'],
          // Vendor chunk for HTTP client
          'vendor-http': ['axios'],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
  },
})
