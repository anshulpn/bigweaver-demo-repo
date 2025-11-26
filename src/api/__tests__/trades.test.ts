import request from 'supertest';
import express from 'express';
import { tradesRouter } from '../trades';

// Mock the services
jest.mock('../../services/tradeHistoryService', () => ({
  getTradeHistory: jest.fn(),
}));

jest.mock('../../services/webhookService', () => ({
  getTradingSystemInstance: jest.fn(),
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

  const mockLimitOrders = [
    {
      id: 'LO_1_123456789',
      symbol: 'BTCUSDT',
      action: 'BUY',
      quantity: 0.1,
      limitPrice: 49000,
      timestamp: 1625097600000,
      strategy: 'TEST',
    },
    {
      id: 'LO_2_123456790',
      symbol: 'ETHUSDT',
      action: 'SELL',
      quantity: 1,
      limitPrice: 3500,
      timestamp: 1625097700000,
      strategy: 'TEST',
    },
  ];

  const mockTradingSystem = {
    getPendingLimitOrders: jest.fn(),
    getPendingLimitOrdersBySymbol: jest.fn(),
    cancelLimitOrder: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { getTradingSystemInstance } = require('../../services/webhookService');
    (getTradingSystemInstance as jest.Mock).mockReturnValue(mockTradingSystem);
  });

  describe('GET /api/trades/history', () => {
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

  describe('GET /api/trades/limit-orders', () => {
    it('should return all pending limit orders successfully', async () => {
      mockTradingSystem.getPendingLimitOrders.mockReturnValue(mockLimitOrders);

      const response = await request(app)
        .get('/api/trades/limit-orders')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(2);
      expect(response.body.data.orders).toEqual(mockLimitOrders);
      expect(mockTradingSystem.getPendingLimitOrders).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors gracefully', async () => {
      mockTradingSystem.getPendingLimitOrders.mockImplementation(() => {
        throw new Error('Service unavailable');
      });

      const response = await request(app)
        .get('/api/trades/limit-orders')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });
  });

  describe('GET /api/trades/limit-orders/:symbol', () => {
    it('should return pending limit orders for specific symbol', async () => {
      const btcOrders = mockLimitOrders.filter(order => order.symbol === 'BTCUSDT');
      mockTradingSystem.getPendingLimitOrdersBySymbol.mockReturnValue(btcOrders);

      const response = await request(app)
        .get('/api/trades/limit-orders/BTCUSDT')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.symbol).toBe('BTCUSDT');
      expect(response.body.data.count).toBe(1);
      expect(response.body.data.orders).toEqual(btcOrders);
      expect(mockTradingSystem.getPendingLimitOrdersBySymbol).toHaveBeenCalledWith('BTCUSDT');
    });
  });

  describe('DELETE /api/trades/limit-orders/:orderId', () => {
    it('should cancel limit order successfully', async () => {
      mockTradingSystem.cancelLimitOrder.mockReturnValue(true);

      const response = await request(app)
        .delete('/api/trades/limit-orders/LO_1_123456789')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Limit order cancelled successfully');
      expect(mockTradingSystem.cancelLimitOrder).toHaveBeenCalledWith('LO_1_123456789');
    });

    it('should return 404 for non-existent order', async () => {
      mockTradingSystem.cancelLimitOrder.mockReturnValue(false);

      const response = await request(app)
        .delete('/api/trades/limit-orders/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Limit order not found');
    });
  });
});