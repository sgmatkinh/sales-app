import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, 
    port: 5173,
    strictPort: true, // Ép chạy đúng port 5173 để Ngrok không bị mất kết nối
    allowedHosts: 'all', 
    
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        // Chỉ rewrite nếu Backend của bạn KHÔNG dùng tiền tố /api
        // Nếu Backend của bạn có router.get('/api/settings'), hãy xóa dòng rewrite dưới đây
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    // Giúp tránh lỗi trang trắng khi thay đổi code (Hot Module Replacement)
    hmr: {
      clientPort: 443, // Quan trọng khi dùng Ngrok HTTPS
    },
  }
})