import request from 'supertest';
import express from 'express';
import { tradesRouter } from '../trades';

// Mock the tradeHistoryService
jest.mock('../../services/tradeHistoryService', () => ({
  getTradeHistory: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/trades', tradesRouter);

describe('Trades API', () => {
  const mockTradeHistory = {
    trades: [
      {
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 50000,
        quantity: 0.1,
        timestamp: 1625097600000,
        strategy: 'TEST',
        commission: 5,
      },
    ],
    positions: [
      {
        symbol: 'BTCUSDT',
        entryPrice: 50000,
        quantity: 0.1,
        timestamp: 1625097600000,
        strategy: 'TEST',
      },
    ],
    analytics: {
      totalTrades: 1,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalProfit: 0,
      totalLoss: 0,
      netProfitLoss: 0,
      averageWin: 0,
      averageLoss: 0,
      totalCommission: 5,
    },
    balance: 4995,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return trade history successfully', async () => {
    const { getTradeHistory } = require('../../services/tradeHistoryService');
    (getTradeHistory as jest.Mock).mockReturnValue(mockTradeHistory);

    const response = await request(app)
      .get('/api/trades/history')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(mockTradeHistory);
    expect(getTradeHistory).toHaveBeenCalledTimes(1);
  });

  it('should handle service errors gracefully', async () => {
    const { getTradeHistory } = require('../../services/tradeHistoryService');
    (getTradeHistory as jest.Mock).mockImplementation(() => {
      throw new Error('Service unavailable');
    });

    const response = await request(app)
      .get('/api/trades/history')
      .expect(500);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Internal server error');
  });
});