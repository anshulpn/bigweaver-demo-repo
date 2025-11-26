import {
  IStrategyPerformance,
  ITradePerformance,
  IPortfolioPerformance,
  ITimeSeriesPerformance,
} from '../models/analytics.interface';
import { IPortfolio, ITrade } from '../trading/paperTradingSystem';

/**
 * Performance Analytics Service
 * Provides comprehensive analytics and performance tracking for trading strategies
 */
export class PerformanceAnalytics {
  private readonly initialBalance: number;
  private tradePerformances: ITradePerformance[] = [];
  private balanceHistory: ITimeSeriesPerformance[] = [];

  /**
   * Creates a new PerformanceAnalytics instance
   * @param initialBalance - The initial portfolio balance
   */
  constructor(initialBalance: number) {
    this.initialBalance = initialBalance;
    this.recordBalanceSnapshot(initialBalance, Date.now());
  }

  /**
   * Records a completed trade's performance
   * @param buyTrade - The buy trade
   * @param sellTrade - The sell trade
   */
  public recordTradePerformance(buyTrade: ITrade, sellTrade: ITrade): void {
    if (buyTrade.action !== 'BUY' || sellTrade.action !== 'SELL') {
      throw new Error('Invalid trade pair: first trade must be BUY, second must be SELL');
    }

    if (buyTrade.symbol !== sellTrade.symbol) {
      throw new Error('Trade pair symbols must match');
    }

    const profit =
      (sellTrade.price - buyTrade.price) * sellTrade.quantity -
      buyTrade.commission -
      sellTrade.commission;

    const profitPercentage = ((sellTrade.price - buyTrade.price) / buyTrade.price) * 100;

    const tradePerformance: ITradePerformance = {
      symbol: buyTrade.symbol,
      strategy: buyTrade.strategy,
      entryPrice: buyTrade.price,
      exitPrice: sellTrade.price,
      quantity: sellTrade.quantity,
      entryTime: buyTrade.timestamp,
      exitTime: sellTrade.timestamp,
      profit,
      profitPercentage,
      commission: buyTrade.commission + sellTrade.commission,
      holdingPeriod: sellTrade.timestamp - buyTrade.timestamp,
    };

    this.tradePerformances.push(tradePerformance);
  }

  /**
   * Records a balance snapshot for time-series analysis
   * @param balance - Current balance
   * @param timestamp - Snapshot timestamp
   * @param portfolioValue - Optional portfolio value including open positions
   */
  public recordBalanceSnapshot(
    balance: number,
    timestamp: number,
    portfolioValue?: number
  ): void {
    const totalValue = portfolioValue || balance;
    const profit = totalValue - this.initialBalance;
    const profitPercentage = (profit / this.initialBalance) * 100;

    const snapshot: ITimeSeriesPerformance = {
      timestamp,
      balance,
      portfolioValue: totalValue,
      profit,
      profitPercentage,
    };

    this.balanceHistory.push(snapshot);
  }

  /**
   * Calculates performance metrics for a specific strategy
   * @param strategy - The strategy name
   * @returns Strategy performance metrics
   */
  public getStrategyPerformance(strategy: string): IStrategyPerformance {
    const strategyTrades = this.tradePerformances.filter((t) => t.strategy === strategy);

    if (strategyTrades.length === 0) {
      return this.getEmptyStrategyPerformance(strategy);
    }

    const winningTrades = strategyTrades.filter((t) => t.profit > 0);
    const losingTrades = strategyTrades.filter((t) => t.profit < 0);

    const totalProfit = winningTrades.reduce((sum, t) => sum + t.profit, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0));
    const netProfit = totalProfit - totalLoss;

    const winRate = strategyTrades.length > 0 
      ? (winningTrades.length / strategyTrades.length) * 100 
      : 0;

    const averageWin = winningTrades.length > 0 
      ? totalProfit / winningTrades.length 
      : 0;
    
    const averageLoss = losingTrades.length > 0 
      ? totalLoss / losingTrades.length 
      : 0;

    const profitFactor = totalLoss > 0 
      ? totalProfit / totalLoss 
      : totalProfit > 0 ? Infinity : 0;

    const largestWin = winningTrades.length > 0 
      ? Math.max(...winningTrades.map((t) => t.profit)) 
      : 0;
    
    const largestLoss = losingTrades.length > 0 
      ? Math.min(...losingTrades.map((t) => t.profit)) 
      : 0;

    const totalCommissions = strategyTrades.reduce((sum, t) => sum + t.commission, 0);

    const timestamps = strategyTrades.map((t) => t.exitTime);
    const startDate = Math.min(...timestamps);
    const endDate = Math.max(...timestamps);

    return {
      strategy,
      totalTrades: strategyTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      totalProfit,
      totalLoss,
      netProfit,
      winRate,
      averageWin,
      averageLoss,
      profitFactor,
      largestWin,
      largestLoss,
      totalCommissions,
      startDate,
      endDate,
    };
  }

  /**
   * Calculates overall portfolio performance metrics
   * @param portfolio - Current portfolio state
   * @returns Portfolio performance metrics
   */
  public getPortfolioPerformance(portfolio: IPortfolio): IPortfolioPerformance {
    const currentBalance = portfolio.balance;
    const totalReturn = currentBalance - this.initialBalance;
    const totalReturnPercentage = (totalReturn / this.initialBalance) * 100;

    const totalCommissions = portfolio.trades.reduce((sum, t) => sum + t.commission, 0);

    // Get unique strategies
    const strategiesSet: { [key: string]: boolean } = {};
    this.tradePerformances.forEach((t) => {
      strategiesSet[t.strategy] = true;
    });
    const strategies = Object.keys(strategiesSet);

    const strategyPerformances = strategies.map((strategy) =>
      this.getStrategyPerformance(strategy)
    );

    return {
      initialBalance: this.initialBalance,
      currentBalance,
      totalReturn,
      totalReturnPercentage,
      totalTrades: portfolio.trades.length,
      openPositions: portfolio.positions.length,
      totalCommissions,
      strategyPerformances,
    };
  }

  /**
   * Gets all recorded trade performances
   * @returns Array of trade performance records
   */
  public getTradePerformances(): ITradePerformance[] {
    return [...this.tradePerformances];
  }

  /**
   * Gets trade performances for a specific strategy
   * @param strategy - The strategy name
   * @returns Array of trade performance records for the strategy
   */
  public getTradePerformancesByStrategy(strategy: string): ITradePerformance[] {
    return this.tradePerformances.filter((t) => t.strategy === strategy);
  }

  /**
   * Gets the balance history for time-series analysis
   * @returns Array of time-series performance snapshots
   */
  public getBalanceHistory(): ITimeSeriesPerformance[] {
    return [...this.balanceHistory];
  }

  /**
   * Generates a performance report as a formatted string
   * @param portfolio - Current portfolio state
   * @returns Formatted performance report
   */
  public generatePerformanceReport(portfolio: IPortfolio): string {
    const portfolioPerf = this.getPortfolioPerformance(portfolio);
    
    let report = '=== PORTFOLIO PERFORMANCE REPORT ===\n\n';
    report += `Initial Balance: $${portfolioPerf.initialBalance.toFixed(2)}\n`;
    report += `Current Balance: $${portfolioPerf.currentBalance.toFixed(2)}\n`;
    report += `Total Return: $${portfolioPerf.totalReturn.toFixed(2)} (${portfolioPerf.totalReturnPercentage.toFixed(2)}%)\n`;
    report += `Total Trades: ${portfolioPerf.totalTrades}\n`;
    report += `Open Positions: ${portfolioPerf.openPositions}\n`;
    report += `Total Commissions: $${portfolioPerf.totalCommissions.toFixed(2)}\n\n`;

    if (portfolioPerf.strategyPerformances.length > 0) {
      report += '=== STRATEGY PERFORMANCES ===\n\n';
      
      portfolioPerf.strategyPerformances.forEach((strategyPerf) => {
        report += `Strategy: ${strategyPerf.strategy}\n`;
        report += `  Total Trades: ${strategyPerf.totalTrades}\n`;
        report += `  Win Rate: ${strategyPerf.winRate.toFixed(2)}%\n`;
        report += `  Net Profit: $${strategyPerf.netProfit.toFixed(2)}\n`;
        report += `  Profit Factor: ${
          strategyPerf.profitFactor === Infinity 
            ? '∞' 
            : strategyPerf.profitFactor.toFixed(2)
        }\n`;
        report += `  Average Win: $${strategyPerf.averageWin.toFixed(2)}\n`;
        report += `  Average Loss: $${strategyPerf.averageLoss.toFixed(2)}\n`;
        report += `  Largest Win: $${strategyPerf.largestWin.toFixed(2)}\n`;
        report += `  Largest Loss: $${strategyPerf.largestLoss.toFixed(2)}\n`;
        report += `  Total Commissions: $${strategyPerf.totalCommissions.toFixed(2)}\n\n`;
      });
    }

    return report;
  }

  /**
   * Returns an empty strategy performance object
   * @param strategy - The strategy name
   * @returns Empty strategy performance metrics
   */
  private getEmptyStrategyPerformance(strategy: string): IStrategyPerformance {
    return {
      strategy,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfit: 0,
      totalLoss: 0,
      netProfit: 0,
      winRate: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0,
      largestWin: 0,
      largestLoss: 0,
      totalCommissions: 0,
      startDate: 0,
      endDate: 0,
    };
  }
}
