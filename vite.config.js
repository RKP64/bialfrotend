import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url' // Import the necessary function

// A robust way to get the current directory in an ES module environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8000,
    host: true,
    open: true,
  },
  // Add the resolve alias configuration here
  resolve: {
    alias: {
      // Use the correctly resolved __dirname
      '@': path.resolve(__dirname, './src'),
    },
  },
})

