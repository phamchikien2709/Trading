import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Cấu hình Vite
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
