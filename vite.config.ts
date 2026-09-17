import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Peak Nurse Calculator',
        short_name: 'Peak Nurse',
        description: 'Medical Dosage Calculator for Nurses',
        theme_color: '#ffffff',
        background_color: '#f9fafb',
        display: 'standalone',
        id: '/peak-nurse-medical-calculator/',
        start_url: '/peak-nurse-medical-calculator/',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
server: {
    allowedHosts: true,
  },
base: '/peak-nurse-medical-calculator/',
})