import express, { Request, Response } from 'express';
import { getLimitOrderService } from '../services/webhookService';

export const limitOrdersRouter = express.Router();

/**
 * GET /api/limit-orders
 * Get all active limit orders
 */
limitOrdersRouter.get('/', (_req: Request, res: Response) => {
  try {
    const limitOrderService = getLimitOrderService();
    const limitOrders = limitOrderService.getAllLimitOrders();
    
    return res.status(200).json({
      success: true,
      data: {
        count: limitOrders.length,
        orders: limitOrders,
      },
    });
  } catch (error) {
    console.error('Error getting limit orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * GET /api/limit-orders/:symbol
 * Get limit orders for a specific symbol
 */
limitOrdersRouter.get('/:symbol', (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const limitOrderService = getLimitOrderService();
    const limitOrders = limitOrderService.getLimitOrdersBySymbol(symbol);
    
    return res.status(200).json({
      success: true,
      data: {
        symbol,
        count: limitOrders.length,
        orders: limitOrders,
      },
    });
  } catch (error) {
    console.error('Error getting limit orders for symbol:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * DELETE /api/limit-orders/:orderId
 * Cancel a limit order
 */
limitOrdersRouter.delete('/:orderId', (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const limitOrderService = getLimitOrderService();
    const cancelled = limitOrderService.cancelLimitOrder(orderId);
    
    if (!cancelled) {
      return res.status(404).json({
        success: false,
        message: `Limit order ${orderId} not found`,
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `Limit order ${orderId} cancelled successfully`,
    });
  } catch (error) {
    console.error('Error cancelling limit order:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * POST /api/limit-orders/check-price
 * Manually trigger a price check for limit orders
 */
limitOrdersRouter.post('/check-price', (req: Request, res: Response) => {
  try {
    const { symbol, price } = req.body;
    
    if (!symbol || typeof price !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Symbol and price are required',
      });
    }
    
    const limitOrderService = getLimitOrderService();
    const result = limitOrderService.updateMarketPrice(symbol, price);
    
    return res.status(200).json({
      success: true,
      message: `Checked limit orders for ${symbol} at price ${price}`,
      data: result,
    });
  } catch (error) {
    console.error('Error checking limit orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

