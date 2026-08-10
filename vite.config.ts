import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/medi-commu/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['medivu-icon.svg'],
      manifest: {
        name: 'MediVU 증상 질문과 비대면 진료 데모',
        short_name: 'MediVU',
        description: '증상 질문을 진료과로 분류하고 의사 답변에서 진료로 잇는 클릭형 데모',
        theme_color: '#0b2944',
        background_color: '#edf2f6',
        display: 'standalone',
        orientation: 'any',
        start_url: './#/home',
        scope: './',
        lang: 'ko',
        icons: [
          { src: 'medivu-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'medivu-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webmanifest}'],
        navigateFallback: 'index.html',
      },
      devOptions: { enabled: true },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})
