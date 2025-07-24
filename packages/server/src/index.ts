import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import { db, seedDB } from './config/campsitesDb';
import campsitesRouter from './routes/campsites/campsitesRoutes';
import authRoutes from './routes/auth/authRoutes';

import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const swaggerDocument = YAML.load(__dirname + '/../openapi.yaml');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per minute 
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests. Please try again later."
    });
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(globalLimiter);

// Serve static frontend if built
const staticPath = path.join(__dirname, "../client/dist");
const indexHtmlPath = path.join(staticPath, "index.html");

const setupStaticFileServing = async (): Promise<void> => {
  try {
    await fs.access(indexHtmlPath); // Check if the index.html exists
    app.use(express.static(staticPath)); // Serve static files

    // Fallback to index.html for all routes that aren't API calls
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });

    console.log("Static file serving set up successfully.");
  } catch (err) {
    console.warn("client/dist/index.html not found, skipping static route handling.");
  }
};

// Initialize the app, including DB seeding and starting the server
const initializeApp = async (forceSeed = false): Promise<void> => {
  try {
    if (process.env.NODE_ENV !== 'test') {
      let shouldSeed = forceSeed;
      if (!forceSeed) {
        const keysIterable = await db.getKeys({ limit: 1 });
        const keys = Array.from(keysIterable);
        shouldSeed = keys.length === 0;
      }
      if (shouldSeed) {
        await seedDB();
        console.log("Database seeded successfully.");
      } else {
        console.log("Database already seeded, skipping.");
      }
    }

    // Only start the server if not in test mode
    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
      }).on('error', (err) => {
        console.error("Failed to start server:", err);
        process.exit(1);
      });
    }
  } catch (err) {
    console.error("Error during initialization:", err);
    process.exit(1); // Exit if there's an error during DB seeding or server setup
  }
};


// Auth routes
app.use('/api/v1/auth', authRoutes);

// Public campsites routes
app.use('/api/v1/campsites', campsitesRouter);



// Serve API documentation using Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Handle 404 for API routes (not found)
app.use('/api', (req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// General error handler for all routes
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error"
  });
});

// Check for --force-seed flag
const forceSeed = process.argv.includes('--force-seed');

// Initialize static file serving and then initialize the app
setupStaticFileServing()
  .then(() => initializeApp(forceSeed))
  .catch((err) => {
    console.error("Error during app setup:", err);
    process.exit(1);
  });

export default app;