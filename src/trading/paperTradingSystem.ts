import { ITradingViewWebhook } from '../models/webhook.interface';
import { PerformanceAnalytics } from '../services/performanceAnalytics';
import { IPortfolioPerformance } from '../models/analytics.interface';

/**
 * Configuration for the paper trading system
 */
export interface IPaperTradingConfig {
  initialBalance: number;
  commission: number;
}

/**
 * Portfolio interface representing the current state of the paper trading account
 */
export interface IPortfolio {
  balance: number;
  positions: IPosition[];
  trades: ITrade[];
}

/**
 * Position interface representing an open position
 */
export interface IPosition {
  symbol: string;
  entryPrice: number;
  quantity: number;
  timestamp: number;
  strategy: string;
}

/**
 * Trade interface representing a completed trade
 */
export interface ITrade {
  symbol: string;
  action: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  timestamp: number;
  strategy: string;
  commission: number;
}

/**
 * Paper Trading System implementation
 * Simulates trading without using real money
 */
export class PaperTradingSystem {
  private portfolio: IPortfolio;
  private readonly commission: number;
  private readonly analytics: PerformanceAnalytics;

  /**
   * Creates a new PaperTradingSystem
   * @param config - Configuration for the paper trading system
   */
  constructor(config: IPaperTradingConfig) {
    this.portfolio = {
      balance: config.initialBalance,
      positions: [],
      trades: [],
    };
    this.commission = config.commission;
    this.analytics = new PerformanceAnalytics(config.initialBalance);
  }

  /**
   * Executes a paper trade based on the webhook data
   * @param trade - The trade to execute
   * @returns The updated portfolio
   */
  public executeTrade(trade: ITradingViewWebhook): IPortfolio {
    const { symbol, action, price, quantity, strategy, timestamp } = trade;
    
    // Calculate commission
    const tradeValue = price * quantity;
    const commissionAmount = tradeValue * (this.commission / 100);
    
    if (action === 'BUY') {
      // Check if we have enough balance
      if (this.portfolio.balance < tradeValue + commissionAmount) {
        throw new Error('Insufficient balance to execute buy order');
      }
      
      // Add position
      this.portfolio.positions.push({
        symbol,
        entryPrice: price,
        quantity,
        timestamp,
        strategy,
      });
      
      // Update balance
      this.portfolio.balance -= (tradeValue + commissionAmount);
    } else if (action === 'SELL') {
      // Find matching position
      const positionIndex = this.portfolio.positions.findIndex(
        (pos) => pos.symbol === symbol && pos.quantity >= quantity
      );
      
      if (positionIndex === -1) {
        throw new Error(`No matching position found for ${symbol}`);
      }
      
      const position = this.portfolio.positions[positionIndex];
      
      // Update balance
      this.portfolio.balance += price * quantity - commissionAmount;
      
      // Find the matching buy trade for analytics
      const buyTrade = this.findMatchingBuyTrade(symbol, strategy, quantity);
      
      // Update position
      if (position.quantity === quantity) {
        // Remove position if fully sold
        this.portfolio.positions.splice(positionIndex, 1);
      } else {
        // Reduce position quantity if partially sold
        this.portfolio.positions[positionIndex].quantity -= quantity;
      }
      
      // Record the sell trade
      const sellTrade: ITrade = {
        symbol,
        action,
        price,
        quantity,
        timestamp,
        strategy,
        commission: commissionAmount,
      };
      
      this.portfolio.trades.push(sellTrade);
      
      // Track trade performance for analytics
      if (buyTrade) {
        this.analytics.recordTradePerformance(buyTrade, sellTrade);
      }
      
      // Record balance snapshot
      const portfolioValue = this.calculatePortfolioValue(price);
      this.analytics.recordBalanceSnapshot(this.portfolio.balance, timestamp, portfolioValue);
      
      return this.getPortfolio();
    }
    
    // Record the trade (for BUY orders)
    this.portfolio.trades.push({
      symbol,
      action,
      price,
      quantity,
      timestamp,
      strategy,
      commission: commissionAmount,
    });
    
    return this.getPortfolio();
  }

  /**
   * Gets the current portfolio state
   * @returns The current portfolio
   */
  public getPortfolio(): IPortfolio {
    return {
      ...this.portfolio,
      positions: [...this.portfolio.positions],
      trades: [...this.portfolio.trades],
    };
  }

  /**
   * Gets portfolio performance analytics
   * @returns Portfolio performance metrics
   */
  public getPortfolioPerformance(): IPortfolioPerformance {
    return this.analytics.getPortfolioPerformance(this.portfolio);
  }

  /**
   * Gets performance analytics for a specific strategy
   * @param strategy - The strategy name
   * @returns Strategy performance metrics
   */
  public getStrategyPerformance(strategy: string) {
    return this.analytics.getStrategyPerformance(strategy);
  }

  /**
   * Gets all trade performances
   * @returns Array of trade performance records
   */
  public getTradePerformances() {
    return this.analytics.getTradePerformances();
  }

  /**
   * Gets trade performances for a specific strategy
   * @param strategy - The strategy name
   * @returns Array of trade performance records for the strategy
   */
  public getTradePerformancesByStrategy(strategy: string) {
    return this.analytics.getTradePerformancesByStrategy(strategy);
  }

  /**
   * Gets the balance history for time-series analysis
   * @returns Array of time-series performance snapshots
   */
  public getBalanceHistory() {
    return this.analytics.getBalanceHistory();
  }

  /**
   * Generates a comprehensive performance report
   * @returns Formatted performance report string
   */
  public generatePerformanceReport(): string {
    return this.analytics.generatePerformanceReport(this.portfolio);
  }

  /**
   * Finds a matching buy trade for a given sell trade
   * @param symbol - The trading symbol
   * @param strategy - The strategy name
   * @param quantity - The quantity sold
   * @returns The matching buy trade or undefined
   */
  private findMatchingBuyTrade(symbol: string, strategy: string, quantity: number): ITrade | undefined {
    // Find the most recent buy trade that matches the criteria
    const buyTrades = this.portfolio.trades
      .filter((t) => t.action === 'BUY' && t.symbol === symbol && t.strategy === strategy)
      .reverse(); // Most recent first

    return buyTrades.find((t) => t.quantity >= quantity);
  }

  /**
   * Calculates the current portfolio value including open positions
   * @param currentPrice - The current market price (for simplification, assumes all positions at this price)
   * @returns Total portfolio value
   */
  private calculatePortfolioValue(currentPrice: number): number {
    const positionsValue = this.portfolio.positions.reduce((total, position) => {
      // For simplification, we use the current price for all positions
      // In a real system, you'd get market prices for each symbol
      return total + (position.quantity * currentPrice);
    }, 0);

    return this.portfolio.balance + positionsValue;
  }
}