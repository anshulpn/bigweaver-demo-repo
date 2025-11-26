import { PaperTradingSystem } from '../trading/paperTradingSystem';

/**
 * Service for managing limit orders and price updates
 */
export class LimitOrderService {
  private tradingSystem: PaperTradingSystem;

  constructor(tradingSystem: PaperTradingSystem) {
    this.tradingSystem = tradingSystem;
  }

  /**
   * Updates market price for a symbol and checks if any limit orders should be executed
   * @param symbol - The trading symbol
   * @param currentPrice - The current market price
   * @returns Result of checking and executing limit orders
   */
  public updateMarketPrice(symbol: string, currentPrice: number): { executed: number; remaining: number } {
    const limitOrdersBefore = this.tradingSystem.getLimitOrdersBySymbol(symbol).length;
    
    // Check and execute limit orders
    this.tradingSystem.checkAndExecuteLimitOrders(symbol, currentPrice);
    
    const limitOrdersAfter = this.tradingSystem.getLimitOrdersBySymbol(symbol).length;
    
    return {
      executed: limitOrdersBefore - limitOrdersAfter,
      remaining: limitOrdersAfter,
    };
  }

  /**
   * Cancels a limit order by ID
   * @param orderId - The ID of the order to cancel
   * @returns True if the order was cancelled successfully
   */
  public cancelLimitOrder(orderId: string): boolean {
    return this.tradingSystem.cancelLimitOrder(orderId);
  }

  /**
   * Gets all active limit orders
   * @returns Array of active limit orders
   */
  public getAllLimitOrders() {
    return this.tradingSystem.getLimitOrders();
  }

  /**
   * Gets limit orders for a specific symbol
   * @param symbol - The trading symbol
   * @returns Array of limit orders for the symbol
   */
  public getLimitOrdersBySymbol(symbol: string) {
    return this.tradingSystem.getLimitOrdersBySymbol(symbol);
  }
}
