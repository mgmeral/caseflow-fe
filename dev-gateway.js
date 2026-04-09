import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

const app = express()

app.use(
  '/',
  createProxyMiddleware({
    target: 'http://localhost:5173',
    changeOrigin: true,
    secure: false,
    ws: true,
    logLevel: 'debug',
    on: {
      proxyRes(proxyRes, req) {
        console.log(
          `[gateway] ${req.method} ${req.originalUrl} -> ${proxyRes.statusCode ?? 'unknown'}`,
        )
      },
      error(err, req, res) {
        console.error(`[gateway] proxy error for ${req.method} ${req.originalUrl}:`, err.message)
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'text/plain' })
        }
        res.end('Gateway proxy error')
      },
    },
  })
)

app.listen(8090, () => {
  console.log('Gateway running on http://localhost:8090')
})