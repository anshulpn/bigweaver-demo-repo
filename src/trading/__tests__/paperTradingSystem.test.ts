import { PaperTradingSystem } from '../paperTradingSystem';

describe('PaperTradingSystem', () => {
  let tradingSystem: PaperTradingSystem;
  
  beforeEach(() => {
    // Create a new trading system with 10000 initial balance and 0.1% commission
    tradingSystem = new PaperTradingSystem({
      initialBalance: 10000,
      commission: 0.1,
    });
  });
  
  describe('Basic Trading Operations', () => {
    it('should initialize with the correct balance', () => {
      const portfolio = tradingSystem.getPortfolio();
      expect(portfolio.balance).toBe(10000);
      expect(portfolio.positions).toHaveLength(0);
      expect(portfolio.trades).toHaveLength(0);
      expect(portfolio.pendingLimitOrders).toHaveLength(0);
    });
    
    it('should execute a buy order correctly', () => {
      const trade = {
        symbol: 'BTCUSDT',
        action: 'BUY' as const,
        price: 50000,
        quantity: 0.1,
        strategy: 'TEST',
        timestamp: 1625097600000,
      };
      
      const portfolio = tradingSystem.executeTrade(trade);
      
      // Check balance (10000 - 5000 - 5 = 4995)
      // 5000 = price * quantity, 5 = commission
      expect(portfolio.balance).toBeCloseTo(4995, 2);
      expect(portfolio.positions).toHaveLength(1);
      expect(portfolio.trades).toHaveLength(1);
      
      const position = portfolio.positions[0];
      expect(position.symbol).toBe('BTCUSDT');
      expect(position.entryPrice).toBe(50000);
      expect(position.quantity).toBe(0.1);
    });
    
    it('should execute a sell order correctly', () => {
      // First buy
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 50000,
        quantity: 0.1,
        strategy: 'TEST',
        timestamp: 1625097600000,
      });
      
      // Then sell
      const portfolio = tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'SELL',
        price: 55000, // 10% profit
        quantity: 0.1,
        strategy: 'TEST',
        timestamp: 1625097700000,
      });
      
      // Check balance (4995 + 5500 - 5.5 = 10489.5)
      // 5500 = new price * quantity, 5.5 = commission
      expect(portfolio.balance).toBeCloseTo(10489.5, 2);
      expect(portfolio.positions).toHaveLength(0);
      expect(portfolio.trades).toHaveLength(2);
    });
    
    it('should throw an error when buying with insufficient balance', () => {
      const trade = {
        symbol: 'BTCUSDT',
        action: 'BUY' as const,
        price: 100000,
        quantity: 1.1, // More than the balance can afford
        strategy: 'TEST',
        timestamp: 1625097600000,
      };
      
      expect(() => tradingSystem.executeTrade(trade)).toThrow('Insufficient balance');
    });
    
    it('should throw an error when selling a non-existent position', () => {
      const trade = {
        symbol: 'ETHUSDT', // We don't have this position
        action: 'SELL' as const,
        price: 3000,
        quantity: 1,
        strategy: 'TEST',
        timestamp: 1625097600000,
      };
      
      expect(() => tradingSystem.executeTrade(trade)).toThrow('No matching position found');
    });
  });

  describe('Limit Order Functionality', () => {
    describe('Creating Limit Orders', () => {
      it('should create a buy limit order successfully', () => {
        const portfolio = tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'BUY',
          price: 50000, // Current market price
          quantity: 0.1,
          strategy: 'TEST',
          timestamp: 1625097600000,
          orderType: 'LIMIT',
          limitPrice: 49000, // Buy when price drops to 49000
        });
        
        expect(portfolio.balance).toBe(10000); // Balance unchanged
        expect(portfolio.pendingLimitOrders).toHaveLength(1);
        expect(portfolio.positions).toHaveLength(0);
        expect(portfolio.trades).toHaveLength(0);
        
        const limitOrder = portfolio.pendingLimitOrders[0];
        expect(limitOrder.symbol).toBe('BTCUSDT');
        expect(limitOrder.action).toBe('BUY');
        expect(limitOrder.quantity).toBe(0.1);
        expect(limitOrder.limitPrice).toBe(49000);
      });

      it('should create a sell limit order successfully', () => {
        // First buy a position
        tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'BUY',
          price: 50000,
          quantity: 0.1,
          strategy: 'TEST',
          timestamp: 1625097600000,
        });
        
        // Create sell limit order
        const portfolio = tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'SELL',
          price: 50000, // Current market price
          quantity: 0.1,
          strategy: 'TEST',
          timestamp: 1625097700000,
          orderType: 'LIMIT',
          limitPrice: 55000, // Sell when price rises to 55000
        });
        
        expect(portfolio.pendingLimitOrders).toHaveLength(1);
        expect(portfolio.positions).toHaveLength(1); // Position still exists
        
        const limitOrder = portfolio.pendingLimitOrders[0];
        expect(limitOrder.symbol).toBe('BTCUSDT');
        expect(limitOrder.action).toBe('SELL');
        expect(limitOrder.limitPrice).toBe(55000);
      });

      it('should throw error when creating limit order without limit price', () => {
        expect(() => tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'BUY',
          price: 50000,
          quantity: 0.1,
          strategy: 'TEST',
          timestamp: 1625097600000,
          orderType: 'LIMIT',
          // limitPrice missing
        })).toThrow('Limit price is required for limit orders');
      });

      it('should throw error when creating buy limit order with insufficient balance', () => {
        expect(() => tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'BUY',
          price: 50000,
          quantity: 1, // Would cost 50000 + commission
          strategy: 'TEST',
          timestamp: 1625097600000,
          orderType: 'LIMIT',
          limitPrice: 50000,
        })).toThrow('Insufficient balance to create buy limit order');
      });

      it('should throw error when creating sell limit order without position', () => {
        expect(() => tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'SELL',
          price: 50000,
          quantity: 0.1,
          strategy: 'TEST',
          timestamp: 1625097600000,
          orderType: 'LIMIT',
          limitPrice: 55000,
        })).toThrow('Insufficient position to create sell limit order');
      });

      it('should prevent creating multiple sell limit orders exceeding position', () => {
        // Buy position
        tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'BUY',
          price: 50000,
          quantity: 0.1,
          strategy: 'TEST',
          timestamp: 1625097600000,
        });
        
        // Create first sell limit order for full position
        tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'SELL',
          price: 50000,
          quantity: 0.1,
          strategy: 'TEST',
          timestamp: 1625097700000,
          orderType: 'LIMIT',
          limitPrice: 55000,
        });
        
        // Try to create another sell limit order (should fail)
        expect(() => tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'SELL',
          price: 50000,
          quantity: 0.05,
          strategy: 'TEST',
          timestamp: 1625097800000,
          orderType: 'LIMIT',
          limitPrice: 56000,
        })).toThrow('Insufficient position to create sell limit order');
      });
    });

    describe('Executing Limit Orders', () => {
      it('should execute buy limit order when price drops to limit price', () => {
        // Create buy limit order at 49000
        tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'BUY',
          price: 50000,
          quantity: 0.1,
          strategy: 'TEST',
          timestamp: 1625097600000,
          orderType: 'LIMIT',
          limitPrice: 49000,
        });
        
        // Market order comes in at 49000 (triggers limit order)
        const portfolio = tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'BUY',
          price: 49000,
          quantity: 0.05, // Different quantity
          strategy: 'TEST',
          timestamp: 1625097700000,
          orderType: 'MARKET',
        });
        
        // Should have 2 positions and 2 trades
        expect(portfolio.positions).toHaveLength(2);
        expect(portfolio.trades).toHaveLength(2);
        expect(portfolio.pendingLimitOrders).toHaveLength(0);
        
        // Check that limit order was executed
        const limitTrade = portfolio.trades.find(t => t.orderType === 'LIMIT');
        expect(limitTrade).toBeDefined();
        expect(limitTrade?.price).toBe(49000);
        expect(limitTrade?.quantity).toBe(0.1);
      });

      it('should execute sell limit order when price rises to limit price', () => {
        // Buy position
        tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'BUY',
          price: 50000,
          quantity: 0.1,
          strategy: 'TEST',
          timestamp: 1625097600000,
        });
        
        // Create sell limit order at 55000
        tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'SELL',
          price: 50000,
          quantity: 0.1,
          strategy: 'TEST',
          timestamp: 1625097700000,
          orderType: 'LIMIT',
          limitPrice: 55000,
        });
        
        // Market order comes in at 55000 (triggers limit order)
        const portfolio = tradingSystem.executeTrade({
          symbol: 'ETHUSDT', // Different symbol, but provides price update
          action: 'BUY',
          price: 3000,
          quantity: 1,
          strategy: 'TEST',
          timestamp: 1625097800000,
        });
        
        // Manual price update to trigger limit order
        tradingSystem.updateMarketPrice('BTCUSDT', 55000);
        const updatedPortfolio = tradingSystem.getPortfolio();
        
        expect(updatedPortfolio.positions.filter(p => p.symbol === 'BTCUSDT')).toHaveLength(0);
        expect(updatedPortfolio.pendingLimitOrders).toHaveLength(0);
        
        const limitTrade = updatedPortfolio.trades.find(
          t => t.symbol === 'BTCUSDT' && t.orderType === 'LIMIT'
        );
        expect(limitTrade).toBeDefined();
        expect(limitTrade?.action).toBe('SELL');
      });

      it('should not execute buy limit order when price is above limit', () => {
        // Create buy limit order at 49000
        tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'BUY',
          price: 50000,
          quantity: 0.1,
          strategy: 'TEST',
          timestamp: 1625097600000,
          orderType: 'LIMIT',
          limitPrice: 49000,
        });
        
        // Market price stays above limit
        tradingSystem.updateMarketPrice('BTCUSDT', 50000);
        
        const portfolio = tradingSystem.getPortfolio();
        expect(portfolio.pendingLimitOrders).toHaveLength(1);
        expect(portfolio.trades).toHaveLength(0);
      });

      it('should not execute sell limit order when price is below limit', () => {
        // Buy position
        tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'BUY',
          price: 50000,
          quantity: 0.1,
          strategy: 'TEST',
          timestamp: 1625097600000,
        });
        
        // Create sell limit order at 55000
        tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'SELL',
          price: 50000,
          quantity: 0.1,
          strategy: 'TEST',
          timestamp: 1625097700000,
          orderType: 'LIMIT',
          limitPrice: 55000,
        });
        
        // Market price stays below limit
        tradingSystem.updateMarketPrice('BTCUSDT', 54000);
        
        const portfolio = tradingSystem.getPortfolio();
        expect(portfolio.pendingLimitOrders).toHaveLength(1);
        expect(portfolio.positions).toHaveLength(1);
      });

      it('should execute multiple limit orders when conditions are met', () => {
        // Create multiple buy limit orders
        tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'BUY',
          price: 50000,
          quantity: 0.1,
          strategy: 'TEST',
          timestamp: 1625097600000,
          orderType: 'LIMIT',
          limitPrice: 49000,
        });
        
        tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'BUY',
          price: 50000,
          quantity: 0.05,
          strategy: 'TEST',
          timestamp: 1625097700000,
          orderType: 'LIMIT',
          limitPrice: 48000,
        });
        
        // Price drops to 48000 - should execute both orders
        tradingSystem.updateMarketPrice('BTCUSDT', 48000);
        
        const portfolio = tradingSystem.getPortfolio();
        expect(portfolio.pendingLimitOrders).toHaveLength(0);
        expect(portfolio.positions).toHaveLength(2);
        expect(portfolio.trades).toHaveLength(2);
      });
    });

    describe('Managing Limit Orders', () => {
      it('should get all pending limit orders', () => {
        tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'BUY',
          price: 50000,
          quantity: 0.1,
          strategy: 'TEST',
          timestamp: 1625097600000,
          orderType: 'LIMIT',
          limitPrice: 49000,
        });
        
        const pendingOrders = tradingSystem.getPendingLimitOrders();
        expect(pendingOrders).toHaveLength(1);
        expect(pendingOrders[0].symbol).toBe('BTCUSDT');
      });

      it('should get pending limit orders by symbol', () => {
        tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'BUY',
          price: 50000,
          quantity: 0.1,
          strategy: 'TEST',
          timestamp: 1625097600000,
          orderType: 'LIMIT',
          limitPrice: 49000,
        });
        
        tradingSystem.executeTrade({
          symbol: 'ETHUSDT',
          action: 'BUY',
          price: 3000,
          quantity: 1,
          strategy: 'TEST',
          timestamp: 1625097700000,
          orderType: 'LIMIT',
          limitPrice: 2900,
        });
        
        const btcOrders = tradingSystem.getPendingLimitOrdersBySymbol('BTCUSDT');
        expect(btcOrders).toHaveLength(1);
        expect(btcOrders[0].symbol).toBe('BTCUSDT');
        
        const ethOrders = tradingSystem.getPendingLimitOrdersBySymbol('ETHUSDT');
        expect(ethOrders).toHaveLength(1);
        expect(ethOrders[0].symbol).toBe('ETHUSDT');
      });

      it('should cancel a limit order successfully', () => {
        const portfolio = tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'BUY',
          price: 50000,
          quantity: 0.1,
          strategy: 'TEST',
          timestamp: 1625097600000,
          orderType: 'LIMIT',
          limitPrice: 49000,
        });
        
        const orderId = portfolio.pendingLimitOrders[0].id;
        const cancelled = tradingSystem.cancelLimitOrder(orderId);
        
        expect(cancelled).toBe(true);
        expect(tradingSystem.getPendingLimitOrders()).toHaveLength(0);
      });

      it('should return false when cancelling non-existent order', () => {
        const cancelled = tradingSystem.cancelLimitOrder('non-existent-id');
        expect(cancelled).toBe(false);
      });

      it('should generate unique order IDs', () => {
        const portfolio1 = tradingSystem.executeTrade({
          symbol: 'BTCUSDT',
          action: 'BUY',
          price: 50000,
          quantity: 0.1,
          strategy: 'TEST',
          timestamp: 1625097600000,
          orderType: 'LIMIT',
          limitPrice: 49000,
        });
        
        const portfolio2 = tradingSystem.executeTrade({
          symbol: 'ETHUSDT',
          action: 'BUY',
          price: 3000,
          quantity: 1,
          strategy: 'TEST',
          timestamp: 1625097700000,
          orderType: 'LIMIT',
          limitPrice: 2900,
        });
        
        const id1 = portfolio1.pendingLimitOrders[0].id;
        const id2 = portfolio2.pendingLimitOrders[1].id;
        
        expect(id1).not.toBe(id2);
      });
    });
  });
});