import express from 'express';
import cors from 'cors';
import { clientsRouter } from './routes/clients';
import { deliveriesRouter } from './routes/deliveries';
import { pagosRouter } from './routes/pagos';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/clients', clientsRouter);
app.use('/api/deliveries', deliveriesRouter);
app.use('/api/pagos', pagosRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
