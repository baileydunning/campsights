import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import { db, seedDB } from './config/db'; 
import campsitesRouter from './routes/campsitesRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend if built
const staticPath = path.join(__dirname, "../client/dist");
const indexHtmlPath = path.join(staticPath, "index.html");

// Serve static files if client build exists
const setupStaticFileServing = async () => {
  try {
    await fs.access(indexHtmlPath);  
    app.use(express.static(staticPath));  
    app.get(/^\/(?!api).*/, (_, res) => {
      res.sendFile(indexHtmlPath);
    });
    console.log("Static file serving set up successfully.");
  } catch (err) {
    console.warn("client/dist/index.html not found, skipping static route handling.");
  }
};

// Seed the database asynchronously before starting the server
const initializeApp = async () => {
  try {
    if (process.env.NODE_ENV !== 'test') {
      const hasAny = Array.from(db.getKeys({ limit: 1 })).length > 0;
      if (!hasAny) {
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
      process.exit(1); 
    });
  } catch (err) {
    console.error("Error during initialization:", err);
    process.exit(1);
  }
};

// API routes for handling campsites
app.use('/api/v1/campsites', campsitesRouter);

// General error handler for all routes
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error"
  });
});

// Set up static file serving before initializing the app
setupStaticFileServing().then(() => {
  initializeApp();
});

export default app;