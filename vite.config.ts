import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      allowedHosts: true,
      proxy:
        env.VITE_USE_MOCKS === 'true'
          ? undefined
          : {
              '/api': {
                // The frontend always calls relative /api routes in normal dev.
                // Vite forwards them to the local backend without changing the path.
                target: 'http://localhost:8080',
                changeOrigin: true,
                configure: (proxy) => {
                  proxy.on('proxyReq', (proxyReq, req) => {
                    if (req.headers.origin) {
                      proxyReq.removeHeader('origin')
                    }

                    if (req.headers.referer) {
                      proxyReq.removeHeader('referer')
                    }
                  })
                },
              },
            },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  }
})
