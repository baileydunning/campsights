import cluster from 'cluster';
import os from 'os';
import { server } from './server';

const numCPUs = os.cpus().length;
const totalMem = os.totalmem(); // in bytes
const perWorkerMem = 256 * 1024 * 1024; 
const maxWorkersByMem = Math.floor(totalMem / perWorkerMem);
const numWorkers = Math.max(1, Math.min(numCPUs, maxWorkersByMem));
const PORT = process.env.PORT || 3000;

if (cluster.isPrimary) {
  console.log(`Master ${process.pid} is running`);
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker) => {
    console.warn(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  const app = server();
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} running on port ${PORT}`);
  });
}

export { server };