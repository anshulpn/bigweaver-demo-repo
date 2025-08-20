import express from 'express';
import { webhookRouter } from './api/webhook';
import { config } from './config';

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/webhook', webhookRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
const PORT = config.port || 3000;
app.listen(PORT, () => {
  console.log(`Paper Trading Webhook server running on port ${PORT}`);
});

export default app;