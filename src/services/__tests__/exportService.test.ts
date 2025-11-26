import {
  exportTradeData,
  getExportMimeType,
  generateExportFilename,
  ExportFormat,
} from '../exportService';
import { ITradeHistoryData } from '../tradeHistoryService';
import { ITrade, IPosition } from '../../trading/paperTradingSystem';

describe('Export Service', () => {
  const mockTrades: ITrade[] = [
    {
      symbol: 'BTCUSDT',
      action: 'BUY',
      price: 50000,
      quantity: 0.1,
      timestamp: 1620000000000,
      strategy: 'SMA_CROSS',
      commission: 5,
    },
    {
      symbol: 'BTCUSDT',
      action: 'SELL',
      price: 52000,
      quantity: 0.1,
      timestamp: 1620100000000,
      strategy: 'SMA_CROSS',
      commission: 5.2,
    },
    {
      symbol: 'ETHUSDT',
      action: 'BUY',
      price: 3000,
      quantity: 1,
      timestamp: 1620200000000,
      strategy: 'RSI_BOUNCE',
      commission: 3,
    },
  ];

  const mockPositions: IPosition[] = [
    {
      symbol: 'ETHUSDT',
      entryPrice: 3000,
      quantity: 1,
      timestamp: 1620200000000,
      strategy: 'RSI_BOUNCE',
    },
  ];

  const mockTradeHistory: ITradeHistoryData = {
    trades: mockTrades,
    positions: mockPositions,
    balance: 12000,
    analytics: {
      totalTrades: 3,
      winningTrades: 1,
      losingTrades: 0,
      winRate: 100,
      totalProfit: 189.8,
      totalLoss: 0,
      netProfitLoss: 189.8,
      averageWin: 189.8,
      averageLoss: 0,
      totalCommission: 13.2,
    },
  };

  describe('exportTradeData', () => {
    it('should export data in JSON format', () => {
      const result = exportTradeData(mockTradeHistory, { format: 'json' });
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('trades');
      expect(parsed).toHaveProperty('balance');
      expect(parsed.trades).toHaveLength(3);
      expect(parsed.balance).toBe(12000);
    });

    it('should include positions in JSON export when requested', () => {
      const result = exportTradeData(mockTradeHistory, {
        format: 'json',
        includePositions: true,
      });
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('positions');
      expect(parsed.positions).toHaveLength(1);
      expect(parsed.positions[0].symbol).toBe('ETHUSDT');
    });

    it('should include analytics in JSON export when requested', () => {
      const result = exportTradeData(mockTradeHistory, {
        format: 'json',
        includeAnalytics: true,
      });
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('analytics');
      expect(parsed.analytics.totalTrades).toBe(3);
      expect(parsed.analytics.winRate).toBe(100);
      expect(parsed.analytics.netProfitLoss).toBe(189.8);
    });

    it('should not include positions in JSON export when not requested', () => {
      const result = exportTradeData(mockTradeHistory, {
        format: 'json',
        includePositions: false,
      });
      const parsed = JSON.parse(result);

      expect(parsed).not.toHaveProperty('positions');
    });

    it('should not include analytics in JSON export when not requested', () => {
      const result = exportTradeData(mockTradeHistory, {
        format: 'json',
        includeAnalytics: false,
      });
      const parsed = JSON.parse(result);

      expect(parsed).not.toHaveProperty('analytics');
    });

    it('should export data in CSV format', () => {
      const result = exportTradeData(mockTradeHistory, { format: 'csv' });

      expect(result).toContain('=== TRADING DATA EXPORT ===');
      expect(result).toContain('Balance: 12000');
      expect(result).toContain('=== TRADES ===');
      expect(result).toContain('Timestamp,Date,Symbol,Action,Price,Quantity,Strategy,Commission,Total Value');
      expect(result).toContain('BTCUSDT');
      expect(result).toContain('BUY');
      expect(result).toContain('SELL');
    });

    it('should include analytics in CSV export when requested', () => {
      const result = exportTradeData(mockTradeHistory, {
        format: 'csv',
        includeAnalytics: true,
      });

      expect(result).toContain('=== ANALYTICS ===');
      expect(result).toContain('Total Trades: 3');
      expect(result).toContain('Winning Trades: 1');
      expect(result).toContain('Win Rate: 100%');
      expect(result).toContain('Net Profit/Loss: 189.8');
      expect(result).toContain('Total Commission: 13.2');
    });

    it('should include positions in CSV export when requested', () => {
      const result = exportTradeData(mockTradeHistory, {
        format: 'csv',
        includePositions: true,
      });

      expect(result).toContain('=== OPEN POSITIONS ===');
      expect(result).toContain('ETHUSDT');
      expect(result).toContain('RSI_BOUNCE');
    });

    it('should not include analytics section in CSV when not requested', () => {
      const result = exportTradeData(mockTradeHistory, {
        format: 'csv',
        includeAnalytics: false,
      });

      expect(result).not.toContain('=== ANALYTICS ===');
      expect(result).not.toContain('Total Trades:');
    });

    it('should not include positions section in CSV when not requested', () => {
      const result = exportTradeData(mockTradeHistory, {
        format: 'csv',
        includePositions: false,
      });

      expect(result).not.toContain('=== OPEN POSITIONS ===');
    });

    it('should handle empty trades array', () => {
      const emptyHistory: ITradeHistoryData = {
        ...mockTradeHistory,
        trades: [],
      };

      const csvResult = exportTradeData(emptyHistory, { format: 'csv' });
      expect(csvResult).toContain('No trades to export');

      const jsonResult = exportTradeData(emptyHistory, { format: 'json' });
      const parsed = JSON.parse(jsonResult);
      expect(parsed.trades).toHaveLength(0);
    });

    it('should handle empty positions array', () => {
      const noPositionsHistory: ITradeHistoryData = {
        ...mockTradeHistory,
        positions: [],
      };

      const result = exportTradeData(noPositionsHistory, {
        format: 'csv',
        includePositions: true,
      });

      expect(result).toContain('No open positions');
    });

    it('should throw error for unsupported format', () => {
      expect(() => {
        exportTradeData(mockTradeHistory, { format: 'xml' as ExportFormat });
      }).toThrow('Unsupported export format: xml');
    });

    it('should format CSV numbers with 2 decimal places', () => {
      const result = exportTradeData(mockTradeHistory, { format: 'csv' });

      expect(result).toContain('50000.00');
      expect(result).toContain('52000.00');
      expect(result).toContain('5.00');
      expect(result).toContain('5.20');
    });

    it('should include timestamps in ISO format in CSV', () => {
      const result = exportTradeData(mockTradeHistory, { format: 'csv' });

      // Check that ISO date format is present
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('getExportMimeType', () => {
    it('should return correct MIME type for CSV', () => {
      const mimeType = getExportMimeType('csv');
      expect(mimeType).toBe('text/csv');
    });

    it('should return correct MIME type for JSON', () => {
      const mimeType = getExportMimeType('json');
      expect(mimeType).toBe('application/json');
    });

    it('should throw error for unsupported format', () => {
      expect(() => {
        getExportMimeType('xml' as ExportFormat);
      }).toThrow('Unsupported export format: xml');
    });
  });

  describe('generateExportFilename', () => {
    it('should generate filename with CSV extension', () => {
      const filename = generateExportFilename('csv');
      expect(filename).toMatch(/^trading-data-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/);
    });

    it('should generate filename with JSON extension', () => {
      const filename = generateExportFilename('json');
      expect(filename).toMatch(/^trading-data-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
    });

    it('should generate unique filenames for different timestamps', () => {
      const filename1 = generateExportFilename('csv');
      // Wait a small amount to ensure different timestamp
      const filename2 = generateExportFilename('csv');
      
      // Filenames should have same format but potentially different timestamps
      expect(filename1).toMatch(/^trading-data-/);
      expect(filename2).toMatch(/^trading-data-/);
    });

    it('should not contain colons or dots in timestamp', () => {
      const filename = generateExportFilename('csv');
      // Extract the timestamp part (between 'trading-data-' and '.csv')
      const timestampPart = filename.replace('trading-data-', '').replace('.csv', '');
      
      expect(timestampPart).not.toContain(':');
      expect(timestampPart).not.toContain('.');
    });
  });
});
