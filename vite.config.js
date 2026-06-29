import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const port = Number(process.env.PORT) || 4173

export default defineConfig({
  root: 'candle-desk',
  plugins: [react()],
  preview: {
    host: '0.0.0.0',
    port,
    allowedHosts: true,
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
})
