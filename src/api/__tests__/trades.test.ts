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
      {
        symbol: 'BTCUSDT',
        action: 'SELL',
        price: 52000,
        quantity: 0.1,
        timestamp: 1625184000000,
        strategy: 'TEST',
        commission: 5.2,
      },
    ],
    positions: [
      {
        symbol: 'ETHUSDT',
        entryPrice: 3000,
        quantity: 1,
        timestamp: 1625270400000,
        strategy: 'RSI_BOUNCE',
      },
    ],
    analytics: {
      totalTrades: 2,
      winningTrades: 1,
      losingTrades: 0,
      winRate: 100,
      totalProfit: 189.8,
      totalLoss: 0,
      netProfitLoss: 189.8,
      averageWin: 189.8,
      averageLoss: 0,
      totalCommission: 10.2,
    },
    balance: 7189.8,
  };

  beforeEach(() => {
    jest.clearAllMocks();
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

  describe('GET /api/trades/export', () => {
    beforeEach(() => {
      const { getTradeHistory } = require('../../services/tradeHistoryService');
      (getTradeHistory as jest.Mock).mockReturnValue(mockTradeHistory);
    });

    it('should export data in CSV format by default', async () => {
      const response = await request(app)
        .get('/api/trades/export')
        .expect(200);

      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename="trading-data-.*\.csv"/);
      expect(response.text).toContain('=== TRADING DATA EXPORT ===');
      expect(response.text).toContain('Balance: 7189.8');
      expect(response.text).toContain('=== TRADES ===');
      expect(response.text).toContain('BTCUSDT');
    });

    it('should export data in JSON format when requested', async () => {
      const response = await request(app)
        .get('/api/trades/export?format=json')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename="trading-data-.*\.json"/);
      
      const jsonData = JSON.parse(response.text);
      expect(jsonData).toHaveProperty('trades');
      expect(jsonData).toHaveProperty('balance');
      expect(jsonData.balance).toBe(7189.8);
      expect(jsonData.trades).toHaveLength(2);
    });

    it('should include positions when includePositions=true', async () => {
      const response = await request(app)
        .get('/api/trades/export?format=json&includePositions=true')
        .expect(200);

      const jsonData = JSON.parse(response.text);
      expect(jsonData).toHaveProperty('positions');
      expect(jsonData.positions).toHaveLength(1);
      expect(jsonData.positions[0].symbol).toBe('ETHUSDT');
    });

    it('should include analytics when includeAnalytics=true', async () => {
      const response = await request(app)
        .get('/api/trades/export?format=json&includeAnalytics=true')
        .expect(200);

      const jsonData = JSON.parse(response.text);
      expect(jsonData).toHaveProperty('analytics');
      expect(jsonData.analytics.totalTrades).toBe(2);
      expect(jsonData.analytics.netProfitLoss).toBe(189.8);
    });

    it('should exclude positions when includePositions=false', async () => {
      const response = await request(app)
        .get('/api/trades/export?format=json&includePositions=false')
        .expect(200);

      const jsonData = JSON.parse(response.text);
      expect(jsonData).not.toHaveProperty('positions');
    });

    it('should exclude analytics when includeAnalytics=false', async () => {
      const response = await request(app)
        .get('/api/trades/export?format=json&includeAnalytics=false')
        .expect(200);

      const jsonData = JSON.parse(response.text);
      expect(jsonData).not.toHaveProperty('analytics');
    });

    it('should include analytics and positions in CSV when requested', async () => {
      const response = await request(app)
        .get('/api/trades/export?format=csv&includeAnalytics=true&includePositions=true')
        .expect(200);

      expect(response.text).toContain('=== ANALYTICS ===');
      expect(response.text).toContain('Total Trades: 2');
      expect(response.text).toContain('Win Rate: 100%');
      expect(response.text).toContain('=== OPEN POSITIONS ===');
      expect(response.text).toContain('ETHUSDT');
    });

    it('should exclude analytics and positions in CSV when requested', async () => {
      const response = await request(app)
        .get('/api/trades/export?format=csv&includeAnalytics=false&includePositions=false')
        .expect(200);

      expect(response.text).not.toContain('=== ANALYTICS ===');
      expect(response.text).not.toContain('=== OPEN POSITIONS ===');
    });

    it('should return error for invalid format', async () => {
      const response = await request(app)
        .get('/api/trades/export?format=xml')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid format. Supported formats: csv, json');
    });

    it('should handle service errors gracefully', async () => {
      const { getTradeHistory } = require('../../services/tradeHistoryService');
      (getTradeHistory as jest.Mock).mockImplementation(() => {
        throw new Error('Service unavailable');
      });

      const response = await request(app)
        .get('/api/trades/export')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });

    it('should use default parameters when not specified', async () => {
      const response = await request(app)
        .get('/api/trades/export')
        .expect(200);

      // Should default to CSV format with positions and analytics included
      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.text).toContain('=== ANALYTICS ===');
      expect(response.text).toContain('=== OPEN POSITIONS ===');
    });
  });
});