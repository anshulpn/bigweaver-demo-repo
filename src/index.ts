import express, { Request, Response } from 'express';
import { webhookRouter } from './api/webhook';
import { limitOrdersRouter } from './api/limitOrders';
import { config } from './config';

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/webhook', webhookRouter);
app.use('/api/limit-orders', limitOrdersRouter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
const PORT = config.port || 3000;
app.listen(PORT, () => {
  console.log(`Paper Trading Webhook server running on port ${PORT}`);
});

export default app;