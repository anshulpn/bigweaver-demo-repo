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
  
  it('should initialize with the correct balance', () => {
    const portfolio = tradingSystem.getPortfolio();
    expect(portfolio.balance).toBe(10000);
    expect(portfolio.positions).toHaveLength(0);
    expect(portfolio.trades).toHaveLength(0);
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

  describe('Performance Analytics Integration', () => {
    it('should initialize with empty performance analytics', () => {
      const portfolioPerformance = tradingSystem.getPortfolioPerformance();
      
      expect(portfolioPerformance.initialBalance).toBe(10000);
      expect(portfolioPerformance.currentBalance).toBe(10000);
      expect(portfolioPerformance.totalReturn).toBe(0);
      expect(portfolioPerformance.totalReturnPercentage).toBe(0);
      expect(portfolioPerformance.strategyPerformances).toHaveLength(0);
    });

    it('should track strategy performance after completing trades', () => {
      // Execute buy and sell to complete a trade
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 50000,
        quantity: 0.1,
        strategy: 'STRATEGY_A',
        timestamp: 1625097600000,
      });

      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'SELL',
        price: 55000, // 10% profit
        quantity: 0.1,
        strategy: 'STRATEGY_A',
        timestamp: 1625097700000,
      });

      const strategyPerformance = tradingSystem.getStrategyPerformance('STRATEGY_A');
      
      expect(strategyPerformance.strategy).toBe('STRATEGY_A');
      expect(strategyPerformance.totalTrades).toBe(1);
      expect(strategyPerformance.winningTrades).toBe(1);
      expect(strategyPerformance.winRate).toBe(100);
      expect(strategyPerformance.netProfit).toBeCloseTo(489.5, 2); // 500 profit - 10.5 commissions
    });

    it('should track multiple strategies separately', () => {
      // Strategy A - profitable trade
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 50000,
        quantity: 0.1,
        strategy: 'STRATEGY_A',
        timestamp: 1625097600000,
      });

      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'SELL',
        price: 55000,
        quantity: 0.1,
        strategy: 'STRATEGY_A',
        timestamp: 1625097700000,
      });

      // Strategy B - losing trade
      tradingSystem.executeTrade({
        symbol: 'ETHUSDT',
        action: 'BUY',
        price: 3000,
        quantity: 1,
        strategy: 'STRATEGY_B',
        timestamp: 1625097800000,
      });

      tradingSystem.executeTrade({
        symbol: 'ETHUSDT',
        action: 'SELL',
        price: 2800, // 6.67% loss
        quantity: 1,
        strategy: 'STRATEGY_B',
        timestamp: 1625097900000,
      });

      const strategyAPerformance = tradingSystem.getStrategyPerformance('STRATEGY_A');
      const strategyBPerformance = tradingSystem.getStrategyPerformance('STRATEGY_B');

      expect(strategyAPerformance.winRate).toBe(100);
      expect(strategyAPerformance.netProfit).toBeGreaterThan(0);
      expect(strategyBPerformance.winRate).toBe(0);
      expect(strategyBPerformance.netProfit).toBeLessThan(0);
    });

    it('should provide portfolio performance including all strategies', () => {
      // Execute multiple trades with different strategies
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 50000,
        quantity: 0.1,
        strategy: 'STRATEGY_A',
        timestamp: 1625097600000,
      });

      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'SELL',
        price: 55000,
        quantity: 0.1,
        strategy: 'STRATEGY_A',
        timestamp: 1625097700000,
      });

      const portfolioPerformance = tradingSystem.getPortfolioPerformance();

      expect(portfolioPerformance.totalTrades).toBe(2);
      expect(portfolioPerformance.strategyPerformances).toHaveLength(1);
      expect(portfolioPerformance.strategyPerformances[0].strategy).toBe('STRATEGY_A');
      expect(portfolioPerformance.totalReturnPercentage).toBeCloseTo(4.895, 2);
    });

    it('should track trade performances by strategy', () => {
      // Execute trades for Strategy A
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 50000,
        quantity: 0.1,
        strategy: 'STRATEGY_A',
        timestamp: 1625097600000,
      });

      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'SELL',
        price: 55000,
        quantity: 0.1,
        strategy: 'STRATEGY_A',
        timestamp: 1625097700000,
      });

      // Execute another trade for Strategy A
      tradingSystem.executeTrade({
        symbol: 'ETHUSDT',
        action: 'BUY',
        price: 3000,
        quantity: 1,
        strategy: 'STRATEGY_A',
        timestamp: 1625097800000,
      });

      tradingSystem.executeTrade({
        symbol: 'ETHUSDT',
        action: 'SELL',
        price: 3100,
        quantity: 1,
        strategy: 'STRATEGY_A',
        timestamp: 1625097900000,
      });

      const strategyATrades = tradingSystem.getTradePerformancesByStrategy('STRATEGY_A');

      expect(strategyATrades).toHaveLength(2);
      expect(strategyATrades[0].symbol).toBe('BTCUSDT');
      expect(strategyATrades[1].symbol).toBe('ETHUSDT');
    });

    it('should provide balance history for time-series analysis', () => {
      // Initial balance should be recorded
      const initialHistory = tradingSystem.getBalanceHistory();
      expect(initialHistory).toHaveLength(1);
      expect(initialHistory[0].balance).toBe(10000);

      // Execute a trade and check updated history
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
        price: 55000,
        quantity: 0.1,
        strategy: 'TEST',
        timestamp: 1625097700000,
      });

      const updatedHistory = tradingSystem.getBalanceHistory();
      expect(updatedHistory.length).toBeGreaterThan(1);
      expect(updatedHistory[updatedHistory.length - 1].profit).toBeCloseTo(489.5, 2);
    });

    it('should generate a comprehensive performance report', () => {
      // Execute some trades
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 50000,
        quantity: 0.1,
        strategy: 'TEST_STRATEGY',
        timestamp: 1625097600000,
      });

      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'SELL',
        price: 55000,
        quantity: 0.1,
        strategy: 'TEST_STRATEGY',
        timestamp: 1625097700000,
      });

      const report = tradingSystem.generatePerformanceReport();

      expect(report).toContain('PORTFOLIO PERFORMANCE REPORT');
      expect(report).toContain('Initial Balance: $10000.00');
      expect(report).toContain('Strategy: TEST_STRATEGY');
      expect(report).toContain('Win Rate: 100.00%');
      expect(report).toContain('Net Profit:');
    });

    it('should return all trade performances', () => {
      // Execute multiple trades
      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 50000,
        quantity: 0.1,
        strategy: 'STRATEGY_A',
        timestamp: 1625097600000,
      });

      tradingSystem.executeTrade({
        symbol: 'BTCUSDT',
        action: 'SELL',
        price: 55000,
        quantity: 0.1,
        strategy: 'STRATEGY_A',
        timestamp: 1625097700000,
      });

      tradingSystem.executeTrade({
        symbol: 'ETHUSDT',
        action: 'BUY',
        price: 3000,
        quantity: 1,
        strategy: 'STRATEGY_B',
        timestamp: 1625097800000,
      });

      tradingSystem.executeTrade({
        symbol: 'ETHUSDT',
        action: 'SELL',
        price: 3100,
        quantity: 1,
        strategy: 'STRATEGY_B',
        timestamp: 1625097900000,
      });

      const allTradePerformances = tradingSystem.getTradePerformances();

      expect(allTradePerformances).toHaveLength(2);
      expect(allTradePerformances[0].strategy).toBe('STRATEGY_A');
      expect(allTradePerformances[1].strategy).toBe('STRATEGY_B');
    });
  });
});