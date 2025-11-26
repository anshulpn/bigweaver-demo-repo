# Performance Analytics Feature

## Overview

The Performance Analytics feature provides comprehensive tracking, calculation, and reporting capabilities for trading strategy performance in the paper trading system.

## Features

### 1. Performance Metrics Tracking

The system tracks the following metrics for each strategy:

- **Total Trades**: Number of completed trades
- **Winning/Losing Trades**: Count of profitable vs unprofitable trades
- **Win Rate**: Percentage of winning trades
- **Total Profit/Loss**: Sum of all profits and losses
- **Net Profit**: Total profit minus total loss
- **Average Win/Loss**: Average profit per winning trade and loss per losing trade
- **Profit Factor**: Ratio of total profit to total loss
- **Largest Win/Loss**: Maximum profit and loss from a single trade
- **Total Commissions**: Sum of all trading commissions

### 2. Portfolio Performance

Portfolio-level metrics include:

- **Initial Balance**: Starting capital
- **Current Balance**: Current account balance
- **Total Return**: Absolute return in dollars
- **Total Return Percentage**: Return as a percentage of initial capital
- **Total Trades**: Total number of executed trades
- **Open Positions**: Number of currently open positions
- **Strategy Performances**: Individual performance metrics for each strategy

### 3. Time-Series Analysis

Balance history tracking for:

- Balance snapshots at key moments
- Portfolio value including open positions
- Profit/loss over time
- Profit percentage over time

### 4. Trade Performance Records

Individual trade tracking with:

- Entry and exit prices
- Profit/loss amount and percentage
- Holding period duration
- Commission costs
- Strategy association

## Usage

### Basic Usage

```typescript
import { PaperTradingSystem } from './trading/paperTradingSystem';

// Initialize the trading system
const tradingSystem = new PaperTradingSystem({
  initialBalance: 10000,
  commission: 0.1, // 0.1%
});

// Execute trades
tradingSystem.executeTrade({
  symbol: 'BTCUSDT',
  action: 'BUY',
  price: 50000,
  quantity: 0.1,
  strategy: 'MY_STRATEGY',
  timestamp: Date.now(),
});

tradingSystem.executeTrade({
  symbol: 'BTCUSDT',
  action: 'SELL',
  price: 55000,
  quantity: 0.1,
  strategy: 'MY_STRATEGY',
  timestamp: Date.now(),
});

// Get portfolio performance
const portfolioPerformance = tradingSystem.getPortfolioPerformance();
console.log(`Total Return: ${portfolioPerformance.totalReturnPercentage}%`);

// Get strategy-specific performance
const strategyPerf = tradingSystem.getStrategyPerformance('MY_STRATEGY');
console.log(`Win Rate: ${strategyPerf.winRate}%`);
console.log(`Net Profit: $${strategyPerf.netProfit}`);

// Generate a detailed report
const report = tradingSystem.generatePerformanceReport();
console.log(report);
```

### Advanced Features

#### Track Multiple Strategies

```typescript
// Strategy A trades
tradingSystem.executeTrade({
  symbol: 'BTCUSDT',
  action: 'BUY',
  price: 50000,
  quantity: 0.1,
  strategy: 'STRATEGY_A',
  timestamp: Date.now(),
});

// Strategy B trades
tradingSystem.executeTrade({
  symbol: 'ETHUSDT',
  action: 'BUY',
  price: 3000,
  quantity: 1,
  strategy: 'STRATEGY_B',
  timestamp: Date.now(),
});

// Get performance by strategy
const strategyAPerf = tradingSystem.getStrategyPerformance('STRATEGY_A');
const strategyBPerf = tradingSystem.getStrategyPerformance('STRATEGY_B');

// Compare strategies
if (strategyAPerf.winRate > strategyBPerf.winRate) {
  console.log('Strategy A has a higher win rate');
}
```

#### Analyze Trade History

```typescript
// Get all trade performances
const allTrades = tradingSystem.getTradePerformances();
allTrades.forEach((trade) => {
  console.log(`${trade.symbol}: ${trade.profitPercentage.toFixed(2)}% profit`);
});

// Get trades for a specific strategy
const strategyTrades = tradingSystem.getTradePerformancesByStrategy('MY_STRATEGY');
const avgProfit = strategyTrades.reduce((sum, t) => sum + t.profit, 0) / strategyTrades.length;
console.log(`Average profit: $${avgProfit}`);
```

#### Time-Series Analysis

```typescript
// Get balance history
const history = tradingSystem.getBalanceHistory();
history.forEach((snapshot) => {
  console.log(`${new Date(snapshot.timestamp).toISOString()}: $${snapshot.balance}`);
});

// Calculate daily returns
for (let i = 1; i < history.length; i++) {
  const dailyReturn = 
    ((history[i].portfolioValue - history[i-1].portfolioValue) / history[i-1].portfolioValue) * 100;
  console.log(`Daily return: ${dailyReturn.toFixed(2)}%`);
}
```

## API Reference

### PaperTradingSystem Methods

#### `getPortfolioPerformance(): IPortfolioPerformance`
Returns overall portfolio performance metrics including all strategies.

#### `getStrategyPerformance(strategy: string): IStrategyPerformance`
Returns performance metrics for a specific strategy.

#### `getTradePerformances(): ITradePerformance[]`
Returns an array of all completed trade performances.

#### `getTradePerformancesByStrategy(strategy: string): ITradePerformance[]`
Returns trade performances filtered by strategy.

#### `getBalanceHistory(): ITimeSeriesPerformance[]`
Returns time-series balance snapshots for analysis.

#### `generatePerformanceReport(): string`
Generates a formatted text report of portfolio and strategy performances.

## Data Structures

### IStrategyPerformance

```typescript
interface IStrategyPerformance {
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
```

### ITradePerformance

```typescript
interface ITradePerformance {
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
  holdingPeriod: number;
}
```

### IPortfolioPerformance

```typescript
interface IPortfolioPerformance {
  initialBalance: number;
  currentBalance: number;
  totalReturn: number;
  totalReturnPercentage: number;
  totalTrades: number;
  openPositions: number;
  totalCommissions: number;
  strategyPerformances: IStrategyPerformance[];
}
```

### ITimeSeriesPerformance

```typescript
interface ITimeSeriesPerformance {
  timestamp: number;
  balance: number;
  portfolioValue: number;
  profit: number;
  profitPercentage: number;
}
```

## Implementation Details

The performance analytics system consists of:

1. **PerformanceAnalytics Service** (`src/services/performanceAnalytics.ts`): Core analytics engine that calculates all metrics.

2. **Analytics Interfaces** (`src/models/analytics.interface.ts`): TypeScript interfaces defining all analytics data structures.

3. **Integration with PaperTradingSystem** (`src/trading/paperTradingSystem.ts`): Seamless integration that automatically tracks performance as trades are executed.

## Testing

Comprehensive test coverage is provided in:
- `src/services/__tests__/performanceAnalytics.test.ts`
- `src/trading/__tests__/paperTradingSystem.test.ts`

Run tests with:
```bash
npm test
```

## Performance Considerations

- All analytics calculations are performed in-memory
- Trade performance records are stored for historical analysis
- Balance snapshots are recorded on each sell trade
- Large portfolios with thousands of trades may require additional optimization
