import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'node:path'

// SINGLE=1 builds a one-file preview; normal builds are for Base44 hosting.
export default defineConfig({
  plugins: [react(), ...(process.env.SINGLE ? [viteSingleFile()] : [])],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  base: './',
  build: { outDir: process.env.SINGLE ? 'dist-single' : 'dist' },
})
