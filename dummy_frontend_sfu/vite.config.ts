import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    proxy: {
      '/ws-api': {
        target: 'ws://127.0.0.1:2000', // Points to your local Node server
        ws: true,
        secure: false
      }
    }
  }
})