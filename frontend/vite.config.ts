import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      //added
      "@" : path.resolve(import.meta.dirname, "./src"),
      "@server" : path.resolve(import.meta.dirname, "../server")
    }

  },
  server: {
    proxy: {
      "/api":{
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})

