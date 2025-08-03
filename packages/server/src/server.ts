import express from 'express'
import cors from 'cors'
import compression from 'compression'
import path from 'path'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'

import campsitesRouter from './routes/campsites/campsitesRoutes'

dotenv.config()
const swaggerDocument = YAML.load(__dirname + '/../openapi.yaml')

export function server() {
  const app = express()
  app.set('trust proxy', 1)

  app.use(compression({ level: 9, threshold: 0 }))

  const allowedOrigins = [
    'https://campsights.onrender.com',
    'http://localhost:5173',
    'http://localhost:4000',
  ]

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin) return callback(null, true)
        if (allowedOrigins.includes(origin)) {
          return callback(null, true)
        }
        const err = new Error('API access denied: invalid origin')
        ;(err as any).status = 403
        return callback(err)
      },
      credentials: true,
    })
  )

  app.use(express.json())

  function apiOriginCheck(req: express.Request, res: express.Response, next: express.NextFunction) {
    const origin = req.get('origin')
    const referer = req.get('referer')
    const allowed = allowedOrigins.some(
      (o) => (origin && origin.startsWith(o)) || (referer && referer.startsWith(o))
    )
    if (!allowed && origin) {
      res.status(403).json({ error: 'API access denied: invalid origin' })
      return
    }
    next()
  }

  app.use('/api/v1/campsites', apiOriginCheck, campsitesRouter)

  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    handler: (req, res) => {
      res.status(429).json({ error: 'Too many requests. Please try again later.' })
    },
  })

  app.use(globalLimiter)

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'Not Found' })
  })

  const staticPath = path.resolve(__dirname, '../../../packages/client/dist')
  const indexHtmlPath = path.join(staticPath, 'index.html')

  app.use(express.static(staticPath))
  console.log(`Serving static files from ${indexHtmlPath}`)
  app.get('*', globalLimiter, (req, res) => {
    res.sendFile(indexHtmlPath)
  })

  app.use((err: any, req: express.Request, res: express.Response) => {
    console.error('Unhandled error:', err)
    const status = err.status || err.statusCode || 500
    res.status(status).json({ error: err.message || 'Internal Server Error' })
  })

  return app
}
