import { PerformanceAnalytics } from '../performanceAnalytics';
import { ITrade, IPortfolio } from '../../trading/paperTradingSystem';

describe('PerformanceAnalytics', () => {
  let analytics: PerformanceAnalytics;
  const initialBalance = 10000;

  beforeEach(() => {
    analytics = new PerformanceAnalytics(initialBalance);
  });

  describe('recordTradePerformance', () => {
    it('should record a winning trade correctly', () => {
      const buyTrade: ITrade = {
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 50000,
        quantity: 0.1,
        timestamp: 1625097600000,
        strategy: 'TEST',
        commission: 5,
      };

      const sellTrade: ITrade = {
        symbol: 'BTCUSDT',
        action: 'SELL',
        price: 55000,
        quantity: 0.1,
        timestamp: 1625097700000,
        strategy: 'TEST',
        commission: 5.5,
      };

      analytics.recordTradePerformance(buyTrade, sellTrade);
      const performances = analytics.getTradePerformances();

      expect(performances).toHaveLength(1);
      expect(performances[0].profit).toBeCloseTo(489.5, 2);
      expect(performances[0].profitPercentage).toBeCloseTo(10, 2);
      expect(performances[0].holdingPeriod).toBe(100000);
    });

    it('should record a losing trade correctly', () => {
      const buyTrade: ITrade = {
        symbol: 'ETHUSDT',
        action: 'BUY',
        price: 3000,
        quantity: 1,
        timestamp: 1625097600000,
        strategy: 'TEST',
        commission: 3,
      };

      const sellTrade: ITrade = {
        symbol: 'ETHUSDT',
        action: 'SELL',
        price: 2800,
        quantity: 1,
        timestamp: 1625097700000,
        strategy: 'TEST',
        commission: 2.8,
      };

      analytics.recordTradePerformance(buyTrade, sellTrade);
      const performances = analytics.getTradePerformances();

      expect(performances).toHaveLength(1);
      expect(performances[0].profit).toBeCloseTo(-205.8, 2);
      expect(performances[0].profitPercentage).toBeCloseTo(-6.67, 2);
    });

    it('should throw error for invalid trade pair (both BUY)', () => {
      const buyTrade1: ITrade = {
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 50000,
        quantity: 0.1,
        timestamp: 1625097600000,
        strategy: 'TEST',
        commission: 5,
      };

      const buyTrade2: ITrade = {
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 55000,
        quantity: 0.1,
        timestamp: 1625097700000,
        strategy: 'TEST',
        commission: 5.5,
      };

      expect(() => analytics.recordTradePerformance(buyTrade1, buyTrade2)).toThrow(
        'Invalid trade pair'
      );
    });

    it('should throw error for mismatched symbols', () => {
      const buyTrade: ITrade = {
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 50000,
        quantity: 0.1,
        timestamp: 1625097600000,
        strategy: 'TEST',
        commission: 5,
      };

      const sellTrade: ITrade = {
        symbol: 'ETHUSDT',
        action: 'SELL',
        price: 3000,
        quantity: 1,
        timestamp: 1625097700000,
        strategy: 'TEST',
        commission: 3,
      };

      expect(() => analytics.recordTradePerformance(buyTrade, sellTrade)).toThrow(
        'Trade pair symbols must match'
      );
    });
  });

  describe('getStrategyPerformance', () => {
    beforeEach(() => {
      // Add winning trade
      analytics.recordTradePerformance(
        {
          symbol: 'BTCUSDT',
          action: 'BUY',
          price: 50000,
          quantity: 0.1,
          timestamp: 1625097600000,
          strategy: 'STRATEGY_A',
          commission: 5,
        },
        {
          symbol: 'BTCUSDT',
          action: 'SELL',
          price: 55000,
          quantity: 0.1,
          timestamp: 1625097700000,
          strategy: 'STRATEGY_A',
          commission: 5.5,
        }
      );

      // Add losing trade
      analytics.recordTradePerformance(
        {
          symbol: 'ETHUSDT',
          action: 'BUY',
          price: 3000,
          quantity: 1,
          timestamp: 1625097800000,
          strategy: 'STRATEGY_A',
          commission: 3,
        },
        {
          symbol: 'ETHUSDT',
          action: 'SELL',
          price: 2800,
          quantity: 1,
          timestamp: 1625097900000,
          strategy: 'STRATEGY_A',
          commission: 2.8,
        }
      );
    });

    it('should calculate strategy performance metrics correctly', () => {
      const performance = analytics.getStrategyPerformance('STRATEGY_A');

      expect(performance.strategy).toBe('STRATEGY_A');
      expect(performance.totalTrades).toBe(2);
      expect(performance.winningTrades).toBe(1);
      expect(performance.losingTrades).toBe(1);
      expect(performance.winRate).toBeCloseTo(50, 2);
      expect(performance.totalProfit).toBeCloseTo(489.5, 2);
      expect(performance.totalLoss).toBeCloseTo(205.8, 2);
      expect(performance.netProfit).toBeCloseTo(283.7, 2);
      expect(performance.averageWin).toBeCloseTo(489.5, 2);
      expect(performance.averageLoss).toBeCloseTo(205.8, 2);
      expect(performance.profitFactor).toBeCloseTo(2.38, 2);
      expect(performance.totalCommissions).toBeCloseTo(16.3, 2);
    });

    it('should return empty performance for non-existent strategy', () => {
      const performance = analytics.getStrategyPerformance('NON_EXISTENT');

      expect(performance.totalTrades).toBe(0);
      expect(performance.netProfit).toBe(0);
      expect(performance.winRate).toBe(0);
    });
  });

  describe('getPortfolioPerformance', () => {
    it('should calculate portfolio performance correctly', () => {
      const portfolio: IPortfolio = {
        balance: 10500,
        positions: [
          {
            symbol: 'BTCUSDT',
            entryPrice: 50000,
            quantity: 0.1,
            timestamp: 1625097600000,
            strategy: 'TEST',
          },
        ],
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
      };

      const performance = analytics.getPortfolioPerformance(portfolio);

      expect(performance.initialBalance).toBe(initialBalance);
      expect(performance.currentBalance).toBe(10500);
      expect(performance.totalReturn).toBe(500);
      expect(performance.totalReturnPercentage).toBeCloseTo(5, 2);
      expect(performance.totalTrades).toBe(1);
      expect(performance.openPositions).toBe(1);
    });
  });

  describe('recordBalanceSnapshot', () => {
    it('should record balance snapshots for time-series analysis', () => {
      analytics.recordBalanceSnapshot(10000, 1625097600000);
      analytics.recordBalanceSnapshot(10500, 1625097700000, 11000);
      analytics.recordBalanceSnapshot(9800, 1625097800000);

      const history = analytics.getBalanceHistory();

      expect(history).toHaveLength(4); // Including initial snapshot
      expect(history[1].balance).toBe(10000);
      expect(history[2].portfolioValue).toBe(11000);
      expect(history[2].profitPercentage).toBeCloseTo(10, 2);
      expect(history[3].profit).toBe(-200);
    });
  });

  describe('getTradePerformancesByStrategy', () => {
    beforeEach(() => {
      // Strategy A trade
      analytics.recordTradePerformance(
        {
          symbol: 'BTCUSDT',
          action: 'BUY',
          price: 50000,
          quantity: 0.1,
          timestamp: 1625097600000,
          strategy: 'STRATEGY_A',
          commission: 5,
        },
        {
          symbol: 'BTCUSDT',
          action: 'SELL',
          price: 55000,
          quantity: 0.1,
          timestamp: 1625097700000,
          strategy: 'STRATEGY_A',
          commission: 5.5,
        }
      );

      // Strategy B trade
      analytics.recordTradePerformance(
        {
          symbol: 'ETHUSDT',
          action: 'BUY',
          price: 3000,
          quantity: 1,
          timestamp: 1625097800000,
          strategy: 'STRATEGY_B',
          commission: 3,
        },
        {
          symbol: 'ETHUSDT',
          action: 'SELL',
          price: 3100,
          quantity: 1,
          timestamp: 1625097900000,
          strategy: 'STRATEGY_B',
          commission: 3.1,
        }
      );
    });

    it('should filter trade performances by strategy', () => {
      const strategyATrades = analytics.getTradePerformancesByStrategy('STRATEGY_A');
      const strategyBTrades = analytics.getTradePerformancesByStrategy('STRATEGY_B');

      expect(strategyATrades).toHaveLength(1);
      expect(strategyATrades[0].strategy).toBe('STRATEGY_A');
      expect(strategyBTrades).toHaveLength(1);
      expect(strategyBTrades[0].strategy).toBe('STRATEGY_B');
    });
  });

  describe('generatePerformanceReport', () => {
    it('should generate a formatted performance report', () => {
      // Add a completed trade
      analytics.recordTradePerformance(
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
          price: 55000,
          quantity: 0.1,
          timestamp: 1625097700000,
          strategy: 'TEST',
          commission: 5.5,
        }
      );

      const portfolio: IPortfolio = {
        balance: 10489.5,
        positions: [],
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
            price: 55000,
            quantity: 0.1,
            timestamp: 1625097700000,
            strategy: 'TEST',
            commission: 5.5,
          },
        ],
      };

      const report = analytics.generatePerformanceReport(portfolio);

      expect(report).toContain('PORTFOLIO PERFORMANCE REPORT');
      expect(report).toContain('Initial Balance: $10000.00');
      expect(report).toContain('Current Balance: $10489.50');
      expect(report).toContain('Strategy: TEST');
      expect(report).toContain('Win Rate: 100.00%');
    });
  });
});
