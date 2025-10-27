import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const assetsDir = path.resolve(__dirname, '../server/assets')
const DEFAULT_BASE_URL = 'https://nonpresentable-monika-unperturbed.ngrok-free.dev/assets'

function renameHtmlPlugin() {
  return {
    name: 'rename-index-to-buy-boot',
    closeBundle() {
      const indexPath = path.join(assetsDir, 'index.html')
      const targetPath = path.join(assetsDir, 'buy-boot.html')
      if (fs.existsSync(indexPath)) {
        fs.rmSync(targetPath, { force: true })
        fs.renameSync(indexPath, targetPath)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: process.env.BASE_URL?.trim() || DEFAULT_BASE_URL,
  plugins: [react(), renameHtmlPlugin()],
  build: {
    outDir: '../server/assets',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        'buy-boot': 'index.html',
      },
      output: {
        entryFileNames: 'buy-boot-[hash].js',
        chunkFileNames: 'buy-boot-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'buy-boot-[hash][extname]'
          }
          return 'buy-boot-[hash][extname]'
        },
      },
    },
  },
})
