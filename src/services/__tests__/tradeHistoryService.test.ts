import { PaperTradingSystem } from '../../trading/paperTradingSystem';
import { getTradeHistory } from '../tradeHistoryService';

// Mock the webhookService to provide a controlled trading system instance
jest.mock('../webhookService', () => {
  let mockTradingSystem: PaperTradingSystem;
  
  return {
    getTradingSystemInstance: () => {
      if (!mockTradingSystem) {
        mockTradingSystem = new PaperTradingSystem({
          initialBalance: 10000,
          commission: 0.1,
        });
      }
      return mockTradingSystem;
    },
  };
});

describe('TradeHistoryService', () => {
  let tradingSystem: PaperTradingSystem;
  
  beforeEach(() => {
    // Reset the trading system for each test
    jest.clearAllMocks();
    const { getTradingSystemInstance } = require('../webhookService');
    tradingSystem = new PaperTradingSystem({
      initialBalance: 10000,
      commission: 0.1,
    });
    
    // Replace the mocked instance
    (getTradingSystemInstance as jest.Mock).mockReturnValue(tradingSystem);
  });
  
  it('should return empty analytics for new trading system', () => {
    const history = getTradeHistory();
    
    expect(history.balance).toBe(10000);
    expect(history.trades).toHaveLength(0);
    expect(history.positions).toHaveLength(0);
    expect(history.analytics.totalTrades).toBe(0);
    expect(history.analytics.winningTrades).toBe(0);
    expect(history.analytics.losingTrades).toBe(0);
    expect(history.analytics.winRate).toBe(0);
    expect(history.analytics.netProfitLoss).toBe(0);
  });
  
  it('should calculate analytics for completed trades', () => {
    // Execute some trades
    tradingSystem.executeTrade({
      symbol: 'BTCUSDT',
      action: 'BUY',
      price: 50000,
      quantity: 0.1,
      strategy: 'TEST',
      timestamp: 1625097600000,
    });
    
    tradingSystem.executeTrade({
      symbol: 'BTCUSDT',
      action: 'SELL',
      price: 55000, // 10% profit
      quantity: 0.1,
      strategy: 'TEST',
      timestamp: 1625097700000,
    });
    
    // Add a losing trade
    tradingSystem.executeTrade({
      symbol: 'ETHUSDT',
      action: 'BUY',
      price: 3000,
      quantity: 1,
      strategy: 'TEST',
      timestamp: 1625097800000,
    });
    
    tradingSystem.executeTrade({
      symbol: 'ETHUSDT',
      action: 'SELL',
      price: 2800, // Loss
      quantity: 1,
      strategy: 'TEST',
      timestamp: 1625097900000,
    });
    
    const history = getTradeHistory();
    
    expect(history.trades).toHaveLength(4);
    expect(history.positions).toHaveLength(0); // All positions closed
    expect(history.analytics.totalTrades).toBe(4);
    expect(history.analytics.winningTrades).toBe(1);
    expect(history.analytics.losingTrades).toBe(1);
    expect(history.analytics.winRate).toBe(50);
    expect(history.analytics.totalProfit).toBeGreaterThan(0);
    expect(history.analytics.totalLoss).toBeGreaterThan(0);
  });
  
  it('should handle open positions correctly', () => {
    // Execute only buy trades (open positions)
    tradingSystem.executeTrade({
      symbol: 'BTCUSDT',
      action: 'BUY',
      price: 50000,
      quantity: 0.1,
      strategy: 'TEST',
      timestamp: 1625097600000,
    });
    
    tradingSystem.executeTrade({
      symbol: 'ETHUSDT',
      action: 'BUY',
      price: 3000,
      quantity: 0.5,
      strategy: 'TEST2',
      timestamp: 1625097700000,
    });
    
    const history = getTradeHistory();
    
    expect(history.trades).toHaveLength(2);
    expect(history.positions).toHaveLength(2);
    expect(history.analytics.totalTrades).toBe(2);
    expect(history.analytics.winningTrades).toBe(0); // No completed trades
    expect(history.analytics.losingTrades).toBe(0);
    expect(history.analytics.winRate).toBe(0);
    expect(history.analytics.netProfitLoss).toBe(0);
  });
  
  it('should calculate commission correctly', () => {
    tradingSystem.executeTrade({
      symbol: 'BTCUSDT',
      action: 'BUY',
      price: 1000,
      quantity: 1,
      strategy: 'TEST',
      timestamp: 1625097600000,
    });
    
    const history = getTradeHistory();
    
    // Commission should be 0.1% of 1000 = 1.0
    expect(history.analytics.totalCommission).toBe(1.0);
  });
  
  it('should handle partial position sales', () => {
    // Buy 1 BTC
    tradingSystem.executeTrade({
      symbol: 'BTCUSDT',
      action: 'BUY',
      price: 50000,
      quantity: 1,
      strategy: 'TEST',
      timestamp: 1625097600000,
    });
    
    // Sell 0.5 BTC
    tradingSystem.executeTrade({
      symbol: 'BTCUSDT',
      action: 'SELL',
      price: 55000,
      quantity: 0.5,
      strategy: 'TEST',
      timestamp: 1625097700000,
    });
    
    const history = getTradeHistory();
    
    expect(history.trades).toHaveLength(2);
    expect(history.positions).toHaveLength(1);
    expect(history.positions[0].quantity).toBe(0.5); // Remaining position
    expect(history.analytics.winningTrades).toBe(1);
  });
});