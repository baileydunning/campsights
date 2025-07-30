import cluster from 'cluster';
import os from 'os';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import campsitesRouter from './routes/campsites/campsitesRoutes';

dotenv.config();

const numCPUs = os.cpus().length;
const PORT = process.env.PORT || 3000;
const swaggerDocument = YAML.load(__dirname + '/../openapi.yaml');

const createServer = async () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    handler: (req, res) => {
      res.status(429).json({ error: "Too many requests. Please try again later." });
    }
  });

  app.use(globalLimiter);

  app.use('/api/v1/campsites', campsitesRouter);

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.get('/health', (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use('/api', (req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
  });

  const staticPath = path.join(__dirname, "../client/dist");
  const indexHtmlPath = path.join(staticPath, "index.html");

  try {
    await fs.access(indexHtmlPath);
    app.use(express.static(staticPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });
    console.log("Static file serving set up successfully.");
  } catch {
    console.warn("client/dist/index.html not found, skipping static file setup.");
  }

  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} running on port ${PORT}`);
  }).on('error', (err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
};

if (cluster.isPrimary) {
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.warn(`Worker ${worker.process.pid} died. Starting a new one.`);
    cluster.fork();
  });
} else {
  createServer();
}
