import { ITrade, IPosition } from '../trading/paperTradingSystem';
import { ITradeHistoryData } from './tradeHistoryService';

/**
 * Export format types
 */
export type ExportFormat = 'csv' | 'json';

/**
 * Interface for export options
 */
export interface IExportOptions {
  format: ExportFormat;
  includePositions?: boolean;
  includeAnalytics?: boolean;
}

/**
 * Convert trades to CSV format
 */
function tradesToCSV(trades: ITrade[]): string {
  if (trades.length === 0) {
    return 'No trades to export';
  }

  // CSV Header
  const headers = ['Timestamp', 'Date', 'Symbol', 'Action', 'Price', 'Quantity', 'Strategy', 'Commission', 'Total Value'];
  
  // CSV Rows
  const rows = trades.map(trade => {
    const date = new Date(trade.timestamp).toISOString();
    const totalValue = (trade.price * trade.quantity).toFixed(2);
    
    return [
      trade.timestamp,
      date,
      trade.symbol,
      trade.action,
      trade.price.toFixed(2),
      trade.quantity,
      trade.strategy,
      trade.commission.toFixed(2),
      totalValue,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Convert positions to CSV format
 */
function positionsToCSV(positions: IPosition[]): string {
  if (positions.length === 0) {
    return 'No open positions';
  }

  // CSV Header
  const headers = ['Timestamp', 'Date', 'Symbol', 'Entry Price', 'Quantity', 'Strategy', 'Total Value'];
  
  // CSV Rows
  const rows = positions.map(position => {
    const date = new Date(position.timestamp).toISOString();
    const totalValue = (position.entryPrice * position.quantity).toFixed(2);
    
    return [
      position.timestamp,
      date,
      position.symbol,
      position.entryPrice.toFixed(2),
      position.quantity,
      position.strategy,
      totalValue,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Export trade history data in the specified format
 */
export function exportTradeData(
  tradeHistory: ITradeHistoryData,
  options: IExportOptions
): string {
  const { format, includePositions = false, includeAnalytics = false } = options;

  if (format === 'json') {
    // Export as JSON
    const data: any = {
      trades: tradeHistory.trades,
      balance: tradeHistory.balance,
    };

    if (includePositions) {
      data.positions = tradeHistory.positions;
    }

    if (includeAnalytics) {
      data.analytics = tradeHistory.analytics;
    }

    return JSON.stringify(data, null, 2);
  } else if (format === 'csv') {
    // Export as CSV
    let csvContent = '=== TRADING DATA EXPORT ===\n\n';
    
    csvContent += `Balance: ${tradeHistory.balance}\n\n`;
    
    if (includeAnalytics) {
      csvContent += '=== ANALYTICS ===\n';
      csvContent += `Total Trades: ${tradeHistory.analytics.totalTrades}\n`;
      csvContent += `Winning Trades: ${tradeHistory.analytics.winningTrades}\n`;
      csvContent += `Losing Trades: ${tradeHistory.analytics.losingTrades}\n`;
      csvContent += `Win Rate: ${tradeHistory.analytics.winRate}%\n`;
      csvContent += `Net Profit/Loss: ${tradeHistory.analytics.netProfitLoss}\n`;
      csvContent += `Total Profit: ${tradeHistory.analytics.totalProfit}\n`;
      csvContent += `Total Loss: ${tradeHistory.analytics.totalLoss}\n`;
      csvContent += `Average Win: ${tradeHistory.analytics.averageWin}\n`;
      csvContent += `Average Loss: ${tradeHistory.analytics.averageLoss}\n`;
      csvContent += `Total Commission: ${tradeHistory.analytics.totalCommission}\n\n`;
    }
    
    csvContent += '=== TRADES ===\n';
    csvContent += tradesToCSV(tradeHistory.trades);
    
    if (includePositions && tradeHistory.positions.length > 0) {
      csvContent += '\n\n=== OPEN POSITIONS ===\n';
      csvContent += positionsToCSV(tradeHistory.positions);
    }
    
    return csvContent;
  }

  throw new Error(`Unsupported export format: ${format}`);
}

/**
 * Get the appropriate MIME type for the export format
 */
export function getExportMimeType(format: ExportFormat): string {
  switch (format) {
    case 'csv':
      return 'text/csv';
    case 'json':
      return 'application/json';
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Generate filename for the export with timestamp
 */
export function generateExportFilename(format: ExportFormat): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `trading-data-${timestamp}.${format}`;
}
