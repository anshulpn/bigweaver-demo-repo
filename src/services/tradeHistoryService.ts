import { ITrade, IPosition } from '../trading/paperTradingSystem';
import { getTradingSystemInstance } from './webhookService';

/**
 * Interface for trade analytics data
 */
export interface ITradeAnalytics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfitLoss: number;
  averageWin: number;
  averageLoss: number;
  totalCommission: number;
}

/**
 * Interface for formatted trade history data
 */
export interface ITradeHistoryData {
  trades: ITrade[];
  positions: IPosition[];
  analytics: ITradeAnalytics;
  balance: number;
}

/**
 * Calculate profit/loss for a trade pair (buy and sell)
 */
function calculateTradePnL(buyTrade: ITrade, sellTrade: ITrade): number {
  const buyValue = buyTrade.price * buyTrade.quantity;
  const sellValue = sellTrade.price * sellTrade.quantity;
  return sellValue - buyValue - buyTrade.commission - sellTrade.commission;
}

/**
 * Calculate trade analytics from trade history
 */
function calculateAnalytics(trades: ITrade[]): ITradeAnalytics {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalProfit: 0,
      totalLoss: 0,
      netProfitLoss: 0,
      averageWin: 0,
      averageLoss: 0,
      totalCommission: 0,
    };
  }

  // Group trades by symbol and strategy to match buy/sell pairs
  const tradesBySymbol: { [key: string]: ITrade[] } = {};
  
  trades.forEach(trade => {
    const key = `${trade.symbol}_${trade.strategy}`;
    if (!tradesBySymbol[key]) {
      tradesBySymbol[key] = [];
    }
    tradesBySymbol[key].push(trade);
  });

  let winningTrades = 0;
  let losingTrades = 0;
  let totalProfit = 0;
  let totalLoss = 0;
  let totalCommission = 0;
  const completedTradePairs: number[] = [];

  // Calculate P&L for each symbol/strategy combination
  Object.values(tradesBySymbol).forEach(symbolTrades => {
    symbolTrades.sort((a, b) => a.timestamp - b.timestamp);
    
    let buyQueue: ITrade[] = [];
    
    symbolTrades.forEach(trade => {
      totalCommission += trade.commission;
      
      if (trade.action === 'BUY') {
        buyQueue.push(trade);
      } else if (trade.action === 'SELL' && buyQueue.length > 0) {
        // Match with the oldest buy trade (FIFO)
        const buyTrade = buyQueue.shift()!;
        const pnl = calculateTradePnL(buyTrade, trade);
        
        completedTradePairs.push(pnl);
        
        if (pnl > 0) {
          winningTrades++;
          totalProfit += pnl;
        } else if (pnl < 0) {
          losingTrades++;
          totalLoss += Math.abs(pnl);
        }
      }
    });
  });

  const totalCompletedTrades = completedTradePairs.length;
  const winRate = totalCompletedTrades > 0 ? (winningTrades / totalCompletedTrades) * 100 : 0;
  const averageWin = winningTrades > 0 ? totalProfit / winningTrades : 0;
  const averageLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;

  return {
    totalTrades: trades.length,
    winningTrades,
    losingTrades,
    winRate: Math.round(winRate * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalLoss: Math.round(totalLoss * 100) / 100,
    netProfitLoss: Math.round((totalProfit - totalLoss) * 100) / 100,
    averageWin: Math.round(averageWin * 100) / 100,
    averageLoss: Math.round(averageLoss * 100) / 100,
    totalCommission: Math.round(totalCommission * 100) / 100,
  };
}

/**
 * Get formatted trade history data for visualization
 */
export function getTradeHistory(): ITradeHistoryData {
  const tradingSystem = getTradingSystemInstance();
  const portfolio = tradingSystem.getPortfolio();
  
  const analytics = calculateAnalytics(portfolio.trades);
  
  return {
    trades: portfolio.trades.map(trade => ({
      ...trade,
      // Format timestamp for display
      timestamp: trade.timestamp,
    })),
    positions: portfolio.positions,
    analytics,
    balance: Math.round(portfolio.balance * 100) / 100,
  };
}