import express from 'express';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import campsitesRouter from './routes/campsites';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend if built
const staticPath = path.join(__dirname, "../client/dist");
const indexHtmlPath = path.join(staticPath, "index.html");

if (fs.existsSync(indexHtmlPath)) {
  app.use(express.static(staticPath));
  app.get(/^\/(?!api).*/, (_, res) => {
    res.sendFile(indexHtmlPath);
  });
} else {
  console.warn("client/dist/index.html not found, skipping static route handling.");
}

// API routes
app.use('/api/v1/campsites', campsitesRouter);

export default app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}