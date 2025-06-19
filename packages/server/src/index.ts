import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { seedDB } from './config/db';
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

try {
  if (fs.existsSync(indexHtmlPath)) {
    app.use(express.static(staticPath));
    app.get(/^\/(?!api).*/, (_, res) => {
      res.sendFile(indexHtmlPath);
    });
  } else {
    console.warn("client/dist/index.html not found, skipping static route handling.");
  }
} catch (err) {
  console.error("Error setting up static file serving:", err);
}

// Seed the database with error handling
seedDB().catch((err: unknown) => {
  console.error("Error seeding the database:", err);
});

// API routes for handling campsites
app.use('/api/v1/campsites', campsitesRouter);

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// General error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error"
  });
});

// Start the server if this file is executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  }).on('error', (err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}

export default app;