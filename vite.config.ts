import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/medi-commu/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['medivu-icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
      manifest: {
        id: '/medi-commu/',
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
        // Chrome 설치 기준은 192와 512를 요구한다. SVG도 받지만 버전에 따라
        // 판정이 갈려 PNG를 함께 싣는다. maskable은 마스크 여백까지 계산한 별도 파일이다.
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'medivu-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
        shortcuts: [
          { name: '증상 적어보기', short_name: '질문하기', url: './#/ask' },
          { name: '사연 둘러보기', short_name: '사연', url: './#/stories' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
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
    // 문진 흐름 테스트는 userEvent.type이 글자마다 전체 화면을 다시 그려서
    // 기본 5초를 넘긴다. 느린 것이지 매달린 것이 아니다.
    testTimeout: 20000,
    // 시드 SQL 생성기는 파일을 쓰는 도구라 기본 실행에서 뺀다.
    exclude: ['node_modules/**', 'scripts/**'],
  },
})
