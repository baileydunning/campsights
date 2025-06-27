import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import { db, seedDB } from './config/db';
import campsitesRouter from './routes/campsitesRoutes';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend if built
const staticPath = path.join(__dirname, "../client/dist");
const indexHtmlPath = path.join(staticPath, "index.html");

const setupStaticFileServing = async (): Promise<void> => {
  try {
    await fs.access(indexHtmlPath); // Check if the index.html exists
    app.use(express.static(staticPath)); // Serve static files

    // Rate limiter for fallback route
    const staticLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 30, // limit each IP to 30 requests per minute
      handler: (req, res) => {
        res.status(429).json({
          error: "Too many requests. Please try again later."
        });
      }
    });

    // Fallback to index.html for all routes that aren't API calls
    app.get('*', staticLimiter, (req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });

    console.log("Static file serving set up successfully.");
  } catch (err) {
    console.warn("client/dist/index.html not found, skipping static route handling.");
  }
};

// Initialize the app, including DB seeding and starting the server
const initializeApp = async (): Promise<void> => {
  try {
    if (process.env.NODE_ENV !== 'test') {
      const keysIterable = await db.getKeys({ limit: 1 });
      const keys = Array.from(keysIterable);
      if (keys.length === 0) {
        await seedDB();
        console.log("Database seeded successfully.");
      } else {
        console.log("Database already seeded, skipping.");
      }
    }

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    }).on('error', (err) => {
      console.error("Failed to start server:", err);
      process.exit(1); // Exit if the server fails to start
    });

  } catch (err) {
    console.error("Error during initialization:", err);
    process.exit(1); // Exit if there's an error during DB seeding or server setup
  }
};

// API routes for handling campsites
app.use('/api/v1/campsites', campsitesRouter);

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

// Initialize static file serving and then initialize the app
setupStaticFileServing()
  .then(() => initializeApp())
  .catch((err) => {
    console.error("Error during app setup:", err);
    process.exit(1);
  });

export default app;