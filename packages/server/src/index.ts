import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { seedDB } from './config/db';  // Ensure the correct path to your seedDB function
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
const setupStaticFileServing = () => {
  try {
    if (fs.existsSync(indexHtmlPath)) {
      app.use(express.static(staticPath));
      app.get(/^\/(?!api).*/, (_, res) => {
        res.sendFile(indexHtmlPath); // Serve index.html for non-API routes
      });
    } else {
      console.warn("client/dist/index.html not found, skipping static route handling.");
    }
  } catch (err) {
    console.error("Error setting up static file serving:", err);
  }
};

// Seed the database asynchronously before starting the server
const initializeApp = async () => {
  try {
    await seedDB(); 
    console.log("Database seeded successfully.");
    
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

// Set up static file serving
setupStaticFileServing();

// Initialize the app (seed the database and start server)
initializeApp();

export default app;
