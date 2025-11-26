import express, { Request, Response } from 'express';
import { getTradeHistory } from '../services/tradeHistoryService';
import {
  exportTradeData,
  getExportMimeType,
  generateExportFilename,
  ExportFormat,
} from '../services/exportService';

export const tradesRouter = express.Router();

/**
 * GET /api/trades/history
 * Endpoint for retrieving trade history with analytics
 */
tradesRouter.get('/history', (_req: Request, res: Response) => {
  try {
    const tradeHistory = getTradeHistory();
    
    return res.status(200).json({
      success: true,
      data: tradeHistory,
    });
  } catch (error) {
    console.error('Error retrieving trade history:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * GET /api/trades/export
 * Endpoint for exporting trade data in various formats
 * Query parameters:
 *   - format: 'csv' or 'json' (default: 'csv')
 *   - includePositions: 'true' or 'false' (default: 'true')
 *   - includeAnalytics: 'true' or 'false' (default: 'true')
 */
tradesRouter.get('/export', (req: Request, res: Response) => {
  try {
    // Parse query parameters
    const format = (req.query.format as ExportFormat) || 'csv';
    const includePositions = req.query.includePositions !== 'false';
    const includeAnalytics = req.query.includeAnalytics !== 'false';

    // Validate format
    if (format !== 'csv' && format !== 'json') {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Supported formats: csv, json',
      });
    }

    // Get trade history
    const tradeHistory = getTradeHistory();

    // Export data
    const exportedData = exportTradeData(tradeHistory, {
      format,
      includePositions,
      includeAnalytics,
    });

    // Set response headers for download
    const filename = generateExportFilename(format);
    const mimeType = getExportMimeType(format);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.status(200).send(exportedData);
  } catch (error) {
    console.error('Error exporting trade data:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});
