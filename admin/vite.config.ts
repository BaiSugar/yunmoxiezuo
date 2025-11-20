import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 监听所有网络接口
    port: 8476,
    strictPort: true,
    proxy: {
      // 代理所有 /api 开头的请求到后端服务器
      // 前端请求: /api/auth/login -> 后端: http://localhost:5000/api/v1/auth/login
      '/api': {
        target: 'http://localhost:5000', // 后端服务器地址
        changeOrigin: true, // 支持跨域
        secure: false, // 如果是https接口，需要配置这个参数
        rewrite: (path) => path.replace(/^\/api/, '/api/v1'), // /api -> /api/v1
      },
      // 代理文件上传路径
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // 生产环境构建配置
    rollupOptions: {
      output: {
        // 使用内容哈希命名，只有内容改变时哈希才会改变
        // 这样可以实现增量部署，不需要删除旧文件
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        
        // 手动分包策略，确保第三方库独立打包
        manualChunks: {
          // React 核心
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Redux 状态管理
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          // UI 组件库
          'ui-vendor': ['lucide-react'],
          // 工具库
          'utils-vendor': ['axios'],
        },
      },
    },
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 设置构建输出目录
    outDir: 'dist',
    // 静态资源内联阈值（小于此值会被内联为 base64）
    assetsInlineLimit: 4096,
    // 启用/禁用 gzip 压缩大小报告
    reportCompressedSize: false,
    // chunk 大小警告的限制（单位：KB）
    chunkSizeWarningLimit: 1000,
  },
})
