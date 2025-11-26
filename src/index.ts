import express, { Request, Response } from 'express';
import path from 'path';
import { webhookRouter } from './api/webhook';
import { tradesRouter } from './api/trades';
import { config } from './config';

const app = express();

// Middleware
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/webhook', webhookRouter);
app.use('/api/trades', tradesRouter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Redirect root to trade history visualization
app.get('/', (_req: Request, res: Response) => {
  res.redirect('/trade-history.html');
});

// Start server
const PORT = config.port || 3000;
app.listen(PORT, () => {
  console.log(`Paper Trading Webhook server running on port ${PORT}`);
  console.log(`Trade History Dashboard available at http://localhost:${PORT}/trade-history.html`);
});

export default app;