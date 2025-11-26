/**
 * Performance Analytics Demo
 * 
 * This example demonstrates the comprehensive performance analytics capabilities
 * of the paper trading system.
 */

import { PaperTradingSystem } from '../src/trading/paperTradingSystem';

// Initialize the trading system with $10,000 starting balance and 0.1% commission
const tradingSystem = new PaperTradingSystem({
  initialBalance: 10000,
  commission: 0.1,
});

console.log('=== PERFORMANCE ANALYTICS DEMO ===\n');

// Demonstrate multiple strategies with different outcomes
console.log('1. Executing trades for Strategy A (Profitable)...');

// Strategy A - Profitable BTC trades
tradingSystem.executeTrade({
  symbol: 'BTCUSDT',
  action: 'BUY',
  price: 50000,
  quantity: 0.1,
  strategy: 'STRATEGY_A',
  timestamp: Date.now() - 86400000, // 1 day ago
});

tradingSystem.executeTrade({
  symbol: 'BTCUSDT',
  action: 'SELL',
  price: 55000, // 10% profit
  quantity: 0.1,
  strategy: 'STRATEGY_A',
  timestamp: Date.now() - 43200000, // 12 hours ago
});

// Strategy A - Another profitable ETH trade
tradingSystem.executeTrade({
  symbol: 'ETHUSDT',
  action: 'BUY',
  price: 3000,
  quantity: 1,
  strategy: 'STRATEGY_A',
  timestamp: Date.now() - 21600000, // 6 hours ago
});

tradingSystem.executeTrade({
  symbol: 'ETHUSDT',
  action: 'SELL',
  price: 3150, // 5% profit
  quantity: 1,
  strategy: 'STRATEGY_A',
  timestamp: Date.now() - 10800000, // 3 hours ago
});

console.log('2. Executing trades for Strategy B (Mixed Results)...');

// Strategy B - Mixed results
tradingSystem.executeTrade({
  symbol: 'ADAUSDT',
  action: 'BUY',
  price: 1.00,
  quantity: 1000,
  strategy: 'STRATEGY_B',
  timestamp: Date.now() - 7200000, // 2 hours ago
});

tradingSystem.executeTrade({
  symbol: 'ADAUSDT',
  action: 'SELL',
  price: 0.95, // 5% loss
  quantity: 1000,
  strategy: 'STRATEGY_B',
  timestamp: Date.now() - 3600000, // 1 hour ago
});

// Strategy B - Profitable trade
tradingSystem.executeTrade({
  symbol: 'SOLUSDT',
  action: 'BUY',
  price: 200,
  quantity: 10,
  strategy: 'STRATEGY_B',
  timestamp: Date.now() - 1800000, // 30 minutes ago
});

tradingSystem.executeTrade({
  symbol: 'SOLUSDT',
  action: 'SELL',
  price: 220, // 10% profit
  quantity: 10,
  strategy: 'STRATEGY_B',
  timestamp: Date.now() - 900000, // 15 minutes ago
});

console.log('3. Analyzing Portfolio Performance...\n');

// Get overall portfolio performance
const portfolioPerf = tradingSystem.getPortfolioPerformance();

console.log('=== PORTFOLIO OVERVIEW ===');
console.log(`Initial Balance: $${portfolioPerf.initialBalance.toFixed(2)}`);
console.log(`Current Balance: $${portfolioPerf.currentBalance.toFixed(2)}`);
console.log(`Total Return: $${portfolioPerf.totalReturn.toFixed(2)} (${portfolioPerf.totalReturnPercentage.toFixed(2)}%)`);
console.log(`Total Trades: ${portfolioPerf.totalTrades}`);
console.log(`Total Commissions: $${portfolioPerf.totalCommissions.toFixed(2)}`);
console.log(`Open Positions: ${portfolioPerf.openPositions}\n`);

console.log('=== STRATEGY PERFORMANCES ===');

// Analyze Strategy A
const strategyAPerf = tradingSystem.getStrategyPerformance('STRATEGY_A');
console.log(`Strategy A Results:`);
console.log(`  Total Trades: ${strategyAPerf.totalTrades}`);
console.log(`  Win Rate: ${strategyAPerf.winRate.toFixed(1)}%`);
console.log(`  Net Profit: $${strategyAPerf.netProfit.toFixed(2)}`);
console.log(`  Profit Factor: ${strategyAPerf.profitFactor.toFixed(2)}`);
console.log(`  Average Win: $${strategyAPerf.averageWin.toFixed(2)}`);
console.log(`  Largest Win: $${strategyAPerf.largestWin.toFixed(2)}`);

// Analyze Strategy B
const strategyBPerf = tradingSystem.getStrategyPerformance('STRATEGY_B');
console.log(`\nStrategy B Results:`);
console.log(`  Total Trades: ${strategyBPerf.totalTrades}`);
console.log(`  Win Rate: ${strategyBPerf.winRate.toFixed(1)}%`);
console.log(`  Net Profit: $${strategyBPerf.netProfit.toFixed(2)}`);
console.log(`  Profit Factor: ${strategyBPerf.profitFactor.toFixed(2)}`);
console.log(`  Average Win: $${strategyBPerf.averageWin.toFixed(2)}`);
console.log(`  Average Loss: $${strategyBPerf.averageLoss.toFixed(2)}`);

console.log('\n=== TRADE-BY-TRADE ANALYSIS ===');

// Get all trade performances
const allTrades = tradingSystem.getTradePerformances();
allTrades.forEach((trade, index) => {
  console.log(`Trade ${index + 1}: ${trade.symbol} (${trade.strategy})`);
  console.log(`  Entry: $${trade.entryPrice} → Exit: $${trade.exitPrice}`);
  console.log(`  Profit: $${trade.profit.toFixed(2)} (${trade.profitPercentage.toFixed(2)}%)`);
  console.log(`  Holding Period: ${(trade.holdingPeriod / (1000 * 60 * 60)).toFixed(1)} hours`);
  console.log(`  Commission: $${trade.commission.toFixed(2)}\n`);
});

console.log('=== TIME-SERIES ANALYSIS ===');

// Balance history analysis
const balanceHistory = tradingSystem.getBalanceHistory();
console.log('Balance Evolution:');
balanceHistory.forEach((snapshot, index) => {
  const date = new Date(snapshot.timestamp).toLocaleString();
  console.log(`  ${date}: $${snapshot.portfolioValue.toFixed(2)} (${snapshot.profitPercentage.toFixed(2)}%)`);
});

console.log('\n=== STRATEGY COMPARISON ===');

// Compare strategies
const strategies = [strategyAPerf, strategyBPerf];
const bestStrategy = strategies.reduce((best, current) => 
  current.netProfit > best.netProfit ? current : best
);

console.log(`Best Performing Strategy: ${bestStrategy.strategy}`);
console.log(`  Net Profit: $${bestStrategy.netProfit.toFixed(2)}`);
console.log(`  Win Rate: ${bestStrategy.winRate.toFixed(1)}%`);
console.log(`  Profit Factor: ${bestStrategy.profitFactor.toFixed(2)}`);

console.log('\n=== DETAILED PERFORMANCE REPORT ===');
console.log(tradingSystem.generatePerformanceReport());

// Performance metrics calculations
console.log('\n=== ADDITIONAL INSIGHTS ===');

// Calculate Sharpe-like ratio (simplified)
const totalReturn = portfolioPerf.totalReturnPercentage / 100;
const riskFreeRate = 0.02; // Assume 2% risk-free rate
const volatility = calculateVolatility(allTrades);
const sharpeRatio = (totalReturn - riskFreeRate) / volatility;

console.log(`Portfolio Volatility: ${(volatility * 100).toFixed(2)}%`);
console.log(`Risk-Adjusted Return (Sharpe-like): ${sharpeRatio.toFixed(2)}`);

// Calculate maximum drawdown
const maxDrawdown = calculateMaxDrawdown(balanceHistory);
console.log(`Maximum Drawdown: ${(maxDrawdown * 100).toFixed(2)}%`);

// Best and worst performing symbols
const symbolPerformances = calculateSymbolPerformances(allTrades);
const bestSymbol = Object.entries(symbolPerformances).reduce((best, [symbol, profit]) => 
  profit > best.profit ? { symbol, profit } : best
, { symbol: '', profit: -Infinity });

const worstSymbol = Object.entries(symbolPerformances).reduce((worst, [symbol, profit]) => 
  profit < worst.profit ? { symbol, profit } : worst
, { symbol: '', profit: Infinity });

console.log(`Best Performing Symbol: ${bestSymbol.symbol} (+$${bestSymbol.profit.toFixed(2)})`);
console.log(`Worst Performing Symbol: ${worstSymbol.symbol} ($${worstSymbol.profit.toFixed(2)})`);

// Helper functions for additional calculations
function calculateVolatility(trades: any[]): number {
  if (trades.length === 0) return 0;
  
  const returns = trades.map(t => t.profitPercentage / 100);
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  
  return Math.sqrt(variance);
}

function calculateMaxDrawdown(history: any[]): number {
  let maxDrawdown = 0;
  let peak = history[0]?.portfolioValue || 0;
  
  for (const snapshot of history) {
    if (snapshot.portfolioValue > peak) {
      peak = snapshot.portfolioValue;
    }
    const drawdown = (peak - snapshot.portfolioValue) / peak;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }
  
  return maxDrawdown;
}

function calculateSymbolPerformances(trades: any[]): { [symbol: string]: number } {
  const symbolProfit: { [symbol: string]: number } = {};
  
  for (const trade of trades) {
    symbolProfit[trade.symbol] = (symbolProfit[trade.symbol] || 0) + trade.profit;
  }
  
  return symbolProfit;
}

console.log('\n=== DEMO COMPLETE ===');
console.log('The performance analytics system has successfully tracked and analyzed all trading activity.');
console.log('This demonstrates comprehensive strategy performance monitoring capabilities.');