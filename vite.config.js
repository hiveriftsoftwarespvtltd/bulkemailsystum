import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // We INCLUDE build-classic so Vite converts its UMD code to ESM
    include: ['@ckeditor/ckeditor5-build-classic', '@ckeditor/ckeditor5-react']
  },
  build: {
    commonjsOptions: {
      include: [/ckeditor5-build-classic/, /node_modules/]
    }
  }
})

