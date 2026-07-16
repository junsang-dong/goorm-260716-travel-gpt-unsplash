import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { handleStoryRequest } from './server/story'
import { handleUnsplashRequest } from './server/unsplash'

function apiDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()

        const url = new URL(req.url, 'http://localhost')
        const chunks: Buffer[] = []
        req.on('data', (c) => chunks.push(c))
        req.on('end', async () => {
          try {
            const body =
              chunks.length > 0
                ? JSON.parse(Buffer.concat(chunks).toString('utf8'))
                : {}
            let result: { status: number; data: unknown }

            if (url.pathname === '/api/story') {
              result = await handleStoryRequest(body, env)
            } else if (url.pathname === '/api/unsplash') {
              result = await handleUnsplashRequest(body, env)
            } else {
              result = { status: 404, data: { error: 'Not found' } }
            }

            res.statusCode = result.status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result.data))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: err instanceof Error ? err.message : 'Server error',
              }),
            )
          }
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), apiDevPlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
