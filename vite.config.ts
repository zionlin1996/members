import { defineConfig } from 'vite'
import { reactRouter } from '@react-router/dev/vite'
import { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [reactRouter(), babel({ presets: [reactCompilerPreset()] })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
})
