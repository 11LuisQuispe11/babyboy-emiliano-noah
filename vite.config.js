import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/babyboy-emiliano-noah/',
  server: { watch: { ignored: ['**/.preview-chrome/**', '**/vite-dev*.log', '**/scene-two-*.png'] } },
})
