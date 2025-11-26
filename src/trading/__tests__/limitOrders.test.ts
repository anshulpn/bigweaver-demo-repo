import { PaperTradingSystem } from '../paperTradingSystem';

describe('PaperTradingSystem - Limit Orders', () => {
  let tradingSystem: PaperTradingSystem;
  
  beforeEach(() => {
    tradingSystem = new PaperTradingSystem({
      initialBalance: 10000,
      commission: 0.1,
    });
  });
  
  describe('Limit Buy Orders', () => {
    it('should create a limit buy order', () => {
      const portfolio = tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'LIMIT_BUY',
        price: 50000,
        quantity: 0.1,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
      
      expect(portfolio.limitOrders).toHaveLength(1);
      expect(portfolio.limitOrders[0].symbol).toBe('BTCUSDT');
      expect(portfolio.limitOrders[0].action).toBe('LIMIT_BUY');
      expect(portfolio.limitOrders[0].limitPrice).toBe(50000);
      expect(portfolio.limitOrders[0].quantity).toBe(0.1);
      
      // Balance should be reduced (reserved for order)
      expect(portfolio.balance).toBeCloseTo(4995, 2);
    });
    
    it('should execute limit buy order when price drops to limit price', () => {
      // Create limit buy order at 50000
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'LIMIT_BUY',
        price: 50000,
        quantity: 0.1,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
      
      // Price drops to 50000
      const portfolio = tradingSystem.checkAndExecuteLimitOrders('BTCUSDT', 50000);
      
      expect(portfolio.limitOrders).toHaveLength(0);
      expect(portfolio.positions).toHaveLength(1);
      expect(portfolio.positions[0].symbol).toBe('BTCUSDT');
      expect(portfolio.positions[0].quantity).toBe(0.1);
      expect(portfolio.trades).toHaveLength(1);
    });
    
    it('should execute limit buy order when price drops below limit price', () => {
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'LIMIT_BUY',
        price: 50000,
        quantity: 0.1,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
      
      // Price drops to 48000
      const portfolio = tradingSystem.checkAndExecuteLimitOrders('BTCUSDT', 48000);
      
      expect(portfolio.limitOrders).toHaveLength(0);
      expect(portfolio.positions).toHaveLength(1);
      expect(portfolio.positions[0].entryPrice).toBe(48000);
      
      // Should refund difference since execution price was lower
      expect(portfolio.balance).toBeGreaterThan(0);
    });
    
    it('should not execute limit buy order when price is above limit', () => {
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'LIMIT_BUY',
        price: 50000,
        quantity: 0.1,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
      
      const portfolio = tradingSystem.checkAndExecuteLimitOrders('BTCUSDT', 51000);
      
      expect(portfolio.limitOrders).toHaveLength(1);
      expect(portfolio.positions).toHaveLength(0);
    });
    
    it('should throw error when insufficient balance for limit buy', () => {
      expect(() => {
        tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'LIMIT_BUY',
          price: 100000,
          quantity: 1,
          strategy: 'TEST',
          timestamp: Date.now(),
        });
      }).toThrow('Insufficient balance');
    });
  });
  
  describe('Limit Sell Orders', () => {
    beforeEach(() => {
      // Create a position first
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 50000,
        quantity: 0.2,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
    });
    
    it('should create a limit sell order', () => {
      const portfolio = tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'LIMIT_SELL',
        price: 55000,
        quantity: 0.1,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
      
      expect(portfolio.limitOrders).toHaveLength(1);
      expect(portfolio.limitOrders[0].symbol).toBe('BTCUSDT');
      expect(portfolio.limitOrders[0].action).toBe('LIMIT_SELL');
      expect(portfolio.limitOrders[0].limitPrice).toBe(55000);
      expect(portfolio.limitOrders[0].quantity).toBe(0.1);
      
      // Position should still exist
      expect(portfolio.positions).toHaveLength(1);
      expect(portfolio.positions[0].quantity).toBe(0.2);
    });
    
    it('should execute limit sell order when price rises to limit price', () => {
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'LIMIT_SELL',
        price: 55000,
        quantity: 0.1,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
      
      const balanceBefore = tradingSystem.getPortfolio().balance;
      
      // Price rises to 55000
      const portfolio = tradingSystem.checkAndExecuteLimitOrders('BTCUSDT', 55000);
      
      expect(portfolio.limitOrders).toHaveLength(0);
      expect(portfolio.positions).toHaveLength(1);
      expect(portfolio.positions[0].quantity).toBe(0.1); // 0.2 - 0.1
      expect(portfolio.trades).toHaveLength(2); // 1 buy + 1 sell
      expect(portfolio.balance).toBeGreaterThan(balanceBefore);
    });
    
    it('should execute limit sell order when price rises above limit price', () => {
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'LIMIT_SELL',
        price: 55000,
        quantity: 0.1,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
      
      // Price rises to 56000
      const portfolio = tradingSystem.checkAndExecuteLimitOrders('BTCUSDT', 56000);
      
      expect(portfolio.limitOrders).toHaveLength(0);
      expect(portfolio.positions).toHaveLength(1);
      expect(portfolio.positions[0].quantity).toBe(0.1);
    });
    
    it('should not execute limit sell order when price is below limit', () => {
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'LIMIT_SELL',
        price: 55000,
        quantity: 0.1,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
      
      const portfolio = tradingSystem.checkAndExecuteLimitOrders('BTCUSDT', 54000);
      
      expect(portfolio.limitOrders).toHaveLength(1);
      expect(portfolio.positions[0].quantity).toBe(0.2);
    });
    
    it('should throw error when insufficient position for limit sell', () => {
      expect(() => {
        tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'LIMIT_SELL',
          price: 55000,
          quantity: 0.5, // More than available
          strategy: 'TEST',
          timestamp: Date.now(),
        });
      }).toThrow('Insufficient position');
    });
    
    it('should throw error when no position exists for limit sell', () => {
      expect(() => {
        tradingSystem.executeTrade({
          symbol: 'ETHUSDT', // Different symbol
          action: 'LIMIT_SELL',
          price: 3000,
          quantity: 1,
          strategy: 'TEST',
          timestamp: Date.now(),
        });
      }).toThrow('Insufficient position');
    });
  });
  
  describe('Limit Order Management', () => {
    it('should cancel a limit buy order and refund balance', () => {
      const portfolio1 = tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'LIMIT_BUY',
        price: 50000,
        quantity: 0.1,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
      
      const orderId = portfolio1.limitOrders[0].id;
      const balanceBefore = portfolio1.balance;
      
      const cancelled = tradingSystem.cancelLimitOrder(orderId);
      
      expect(cancelled).toBe(true);
      
      const portfolio2 = tradingSystem.getPortfolio();
      expect(portfolio2.limitOrders).toHaveLength(0);
      expect(portfolio2.balance).toBe(10000); // Full refund
    });
    
    it('should cancel a limit sell order', () => {
      // Create a position
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 50000,
        quantity: 0.2,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
      
      const portfolio1 = tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'LIMIT_SELL',
        price: 55000,
        quantity: 0.1,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
      
      const orderId = portfolio1.limitOrders[0].id;
      const cancelled = tradingSystem.cancelLimitOrder(orderId);
      
      expect(cancelled).toBe(true);
      
      const portfolio2 = tradingSystem.getPortfolio();
      expect(portfolio2.limitOrders).toHaveLength(0);
    });
    
    it('should return false when canceling non-existent order', () => {
      const cancelled = tradingSystem.cancelLimitOrder('non_existent_id');
      expect(cancelled).toBe(false);
    });
    
    it('should get all limit orders', () => {
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'LIMIT_BUY',
        price: 50000,
        quantity: 0.1,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
      
      tradingSystem.executeTrade({
        symbol: 'ETHUSDT',
        action: 'LIMIT_BUY',
        price: 3000,
        quantity: 1,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
      
      const limitOrders = tradingSystem.getLimitOrders();
      expect(limitOrders).toHaveLength(2);
    });
    
    it('should get limit orders by symbol', () => {
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'LIMIT_BUY',
        price: 50000,
        quantity: 0.1,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
      
      tradingSystem.executeTrade({
        symbol: 'ETHUSDT',
        action: 'LIMIT_BUY',
        price: 3000,
        quantity: 1,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
      
      const btcOrders = tradingSystem.getLimitOrdersBySymbol('BTCUSDT');
      expect(btcOrders).toHaveLength(1);
      expect(btcOrders[0].symbol).toBe('BTCUSDT');
    });
  });
  
  describe('Multiple Limit Orders', () => {
    it('should execute multiple limit buy orders at different prices', () => {
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'LIMIT_BUY',
        price: 50000,
        quantity: 0.05,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
      
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'LIMIT_BUY',
        price: 48000,
        quantity: 0.05,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
      
      // Price drops to 48000, should execute both orders
      const portfolio = tradingSystem.checkAndExecuteLimitOrders('BTCUSDT', 48000);
      
      expect(portfolio.limitOrders).toHaveLength(0);
      expect(portfolio.positions).toHaveLength(2);
      expect(portfolio.trades).toHaveLength(2);
    });
    
    it('should execute only eligible limit orders', () => {
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'LIMIT_BUY',
        price: 50000,
        quantity: 0.05,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
      
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'LIMIT_BUY',
        price: 48000,
        quantity: 0.05,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
      
      // Price drops to 49000, should execute only the 50000 order
      const portfolio = tradingSystem.checkAndExecuteLimitOrders('BTCUSDT', 49000);
      
      expect(portfolio.limitOrders).toHaveLength(1);
      expect(portfolio.limitOrders[0].limitPrice).toBe(48000);
      expect(portfolio.positions).toHaveLength(1);
      expect(portfolio.trades).toHaveLength(1);
    });
  });
  
  describe('Mixed Market and Limit Orders', () => {
    it('should handle market orders triggering limit orders', () => {
      // Create a position
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 50000,
        quantity: 0.2,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
      
      // Create limit sell order
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'LIMIT_SELL',
        price: 55000,
        quantity: 0.1,
        strategy: 'TEST',
        timestamp: Date.now(),
      });
      
      // Check if price triggers the limit order
      const portfolio = tradingSystem.checkAndExecuteLimitOrders('BTCUSDT', 55000);
      
      expect(portfolio.limitOrders).toHaveLength(0);
      expect(portfolio.positions).toHaveLength(1);
      expect(portfolio.positions[0].quantity).toBe(0.1);
      expect(portfolio.trades).toHaveLength(2);
    });
  });
});
