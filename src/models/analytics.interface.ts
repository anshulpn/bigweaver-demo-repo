/**
 * Interface for strategy performance metrics
 */
export interface IStrategyPerformance {
  strategy: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  totalCommissions: number;
  startDate: number;
  endDate: number;
}

/**
 * Interface for individual trade performance
 */
export interface ITradePerformance {
  symbol: string;
  strategy: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  entryTime: number;
  exitTime: number;
  profit: number;
  profitPercentage: number;
  commission: number;
  holdingPeriod: number; // in milliseconds
}

/**
 * Interface for portfolio performance metrics
 */
export interface IPortfolioPerformance {
  initialBalance: number;
  currentBalance: number;
  totalReturn: number;
  totalReturnPercentage: number;
  totalTrades: number;
  openPositions: number;
  totalCommissions: number;
  strategyPerformances: IStrategyPerformance[];
}

/**
 * Interface for time-based performance analysis
 */
export interface ITimeSeriesPerformance {
  timestamp: number;
  balance: number;
  portfolioValue: number;
  profit: number;
  profitPercentage: number;
}
