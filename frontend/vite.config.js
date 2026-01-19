import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, 
    port: 5173,
    strictPort: true, 
    allowedHosts: 'all', 
    
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        // PHẢI MỞ DÒNG NÀY: Để nó xóa bớt chữ /api thừa khi gọi từ Frontend
        rewrite: (path) => path.replace(/^\/api/, ''), 
      },
    },
    hmr: {
      clientPort: 443, 
    },
  }
})