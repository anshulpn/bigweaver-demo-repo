import express, { Request, Response } from 'express';
import { getTradeHistory } from '../services/tradeHistoryService';
import { getTradingSystemInstance } from '../services/webhookService';

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
 * GET /api/trades/limit-orders
 * Endpoint for retrieving pending limit orders
 */
tradesRouter.get('/limit-orders', (_req: Request, res: Response) => {
  try {
    const tradingSystem = getTradingSystemInstance();
    const pendingOrders = tradingSystem.getPendingLimitOrders();
    
    return res.status(200).json({
      success: true,
      data: {
        count: pendingOrders.length,
        orders: pendingOrders,
      },
    });
  } catch (error) {
    console.error('Error retrieving limit orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * GET /api/trades/limit-orders/:symbol
 * Endpoint for retrieving pending limit orders for a specific symbol
 */
tradesRouter.get('/limit-orders/:symbol', (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const tradingSystem = getTradingSystemInstance();
    const pendingOrders = tradingSystem.getPendingLimitOrdersBySymbol(symbol);
    
    return res.status(200).json({
      success: true,
      data: {
        symbol,
        count: pendingOrders.length,
        orders: pendingOrders,
      },
    });
  } catch (error) {
    console.error('Error retrieving limit orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * DELETE /api/trades/limit-orders/:orderId
 * Endpoint for cancelling a pending limit order
 */
tradesRouter.delete('/limit-orders/:orderId', (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const tradingSystem = getTradingSystemInstance();
    const cancelled = tradingSystem.cancelLimitOrder(orderId);
    
    if (!cancelled) {
      return res.status(404).json({
        success: false,
        message: 'Limit order not found',
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Limit order cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling limit order:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});
