import express, { Request, Response } from 'express';
import { getTradeHistory } from '../services/tradeHistoryService';

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
