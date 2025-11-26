import { ITradingViewWebhook } from '../models/webhook.interface';

/**
 * Configuration for the paper trading system
 */
export interface IPaperTradingConfig {
  initialBalance: number;
  commission: number;
}

/**
 * Portfolio interface representing the current state of the paper trading account
 */
export interface IPortfolio {
  balance: number;
  positions: IPosition[];
  trades: ITrade[];
  pendingLimitOrders: ILimitOrder[];
}

/**
 * Position interface representing an open position
 */
export interface IPosition {
  symbol: string;
  entryPrice: number;
  quantity: number;
  timestamp: number;
  strategy: string;
}

/**
 * Trade interface representing a completed trade
 */
export interface ITrade {
  symbol: string;
  action: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  timestamp: number;
  strategy: string;
  commission: number;
  orderType: 'MARKET' | 'LIMIT';
}

/**
 * Limit order interface representing a pending limit order
 */
export interface ILimitOrder {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  limitPrice: number;
  timestamp: number;
  strategy: string;
}

/**
 * Paper Trading System implementation
 * Simulates trading without using real money
 */
export class PaperTradingSystem {
  private portfolio: IPortfolio;
  private readonly commission: number;
  private orderIdCounter: number = 0;

  /**
   * Creates a new PaperTradingSystem
   * @param config - Configuration for the paper trading system
   */
  constructor(config: IPaperTradingConfig) {
    this.portfolio = {
      balance: config.initialBalance,
      positions: [],
      trades: [],
      pendingLimitOrders: [],
    };
    this.commission = config.commission;
  }

  /**
   * Executes a paper trade based on the webhook data
   * @param trade - The trade to execute
   * @returns The updated portfolio
   */
  public executeTrade(trade: ITradingViewWebhook): IPortfolio {
    const { symbol, action, price, quantity, strategy, timestamp, orderType = 'MARKET', limitPrice } = trade;
    
    if (orderType === 'LIMIT') {
      // Handle limit order creation
      if (!limitPrice) {
        throw new Error('Limit price is required for limit orders');
      }
      return this.createLimitOrder(symbol, action, quantity, limitPrice, timestamp, strategy);
    } else {
      // Handle market order execution and check limit orders
      this.executeMarketOrder(symbol, action, price, quantity, strategy, timestamp);
      this.checkAndExecuteLimitOrders(symbol, price);
      return this.getPortfolio();
    }
  }

  /**
   * Creates a limit order and adds it to the pending orders
   * @param symbol - Trading symbol
   * @param action - BUY or SELL
   * @param quantity - Order quantity
   * @param limitPrice - Limit price for execution
   * @param timestamp - Order timestamp
   * @param strategy - Strategy identifier
   * @returns The updated portfolio
   */
  private createLimitOrder(
    symbol: string,
    action: 'BUY' | 'SELL',
    quantity: number,
    limitPrice: number,
    timestamp: number,
    strategy: string
  ): IPortfolio {
    // For BUY limit orders, check if we have enough balance when created
    if (action === 'BUY') {
      const tradeValue = limitPrice * quantity;
      const commissionAmount = tradeValue * (this.commission / 100);
      
      if (this.portfolio.balance < tradeValue + commissionAmount) {
        throw new Error('Insufficient balance to create buy limit order');
      }
    }

    // For SELL limit orders, check if we have the position
    if (action === 'SELL') {
      const totalAvailableQuantity = this.portfolio.positions
        .filter(pos => pos.symbol === symbol)
        .reduce((sum, pos) => sum + pos.quantity, 0);
      
      // Check existing pending sell orders for the same symbol
      const pendingSellQuantity = this.portfolio.pendingLimitOrders
        .filter(order => order.symbol === symbol && order.action === 'SELL')
        .reduce((sum, order) => sum + order.quantity, 0);

      if (totalAvailableQuantity < quantity + pendingSellQuantity) {
        throw new Error(`Insufficient position to create sell limit order. Available: ${totalAvailableQuantity - pendingSellQuantity}, Requested: ${quantity}`);
      }
    }

    const limitOrder: ILimitOrder = {
      id: this.generateOrderId(),
      symbol,
      action,
      quantity,
      limitPrice,
      timestamp,
      strategy,
    };

    this.portfolio.pendingLimitOrders.push(limitOrder);
    return this.getPortfolio();
  }

  /**
   * Executes a market order immediately
   * @param symbol - Trading symbol
   * @param action - BUY or SELL
   * @param price - Market price
   * @param quantity - Order quantity
   * @param strategy - Strategy identifier
   * @param timestamp - Order timestamp
   */
  private executeMarketOrder(
    symbol: string,
    action: 'BUY' | 'SELL',
    price: number,
    quantity: number,
    strategy: string,
    timestamp: number
  ): void {
    // Calculate commission
    const tradeValue = price * quantity;
    const commissionAmount = tradeValue * (this.commission / 100);
    
    if (action === 'BUY') {
      // Check if we have enough balance
      if (this.portfolio.balance < tradeValue + commissionAmount) {
        throw new Error('Insufficient balance to execute buy order');
      }
      
      // Add position
      this.portfolio.positions.push({
        symbol,
        entryPrice: price,
        quantity,
        timestamp,
        strategy,
      });
      
      // Update balance
      this.portfolio.balance -= (tradeValue + commissionAmount);
    } else if (action === 'SELL') {
      // Find matching position
      const positionIndex = this.portfolio.positions.findIndex(
        (pos) => pos.symbol === symbol && pos.quantity >= quantity
      );
      
      if (positionIndex === -1) {
        throw new Error(`No matching position found for ${symbol}`);
      }
      
      const position = this.portfolio.positions[positionIndex];
      
      // Update balance
      this.portfolio.balance += price * quantity - commissionAmount;
      
      // Update position
      if (position.quantity === quantity) {
        // Remove position if fully sold
        this.portfolio.positions.splice(positionIndex, 1);
      } else {
        // Reduce position quantity if partially sold
        this.portfolio.positions[positionIndex].quantity -= quantity;
      }
    }
    
    // Record the trade
    this.portfolio.trades.push({
      symbol,
      action,
      price,
      quantity,
      timestamp,
      strategy,
      commission: commissionAmount,
      orderType: 'MARKET',
    });
  }

  /**
   * Checks pending limit orders and executes those that meet price conditions
   * @param symbol - Trading symbol to check (only checks orders for this symbol)
   * @param currentPrice - Current market price for the symbol
   */
  private checkAndExecuteLimitOrders(symbol: string, currentPrice: number): void {
    const ordersToExecute: ILimitOrder[] = [];
    
    // Find orders that should be executed
    for (const order of this.portfolio.pendingLimitOrders) {
      if (order.symbol !== symbol) continue;
      
      let shouldExecute = false;
      
      if (order.action === 'BUY' && currentPrice <= order.limitPrice) {
        shouldExecute = true;
      } else if (order.action === 'SELL' && currentPrice >= order.limitPrice) {
        shouldExecute = true;
      }
      
      if (shouldExecute) {
        ordersToExecute.push(order);
      }
    }
    
    // Execute the orders
    for (const order of ordersToExecute) {
      try {
        this.executeLimitOrder(order, currentPrice);
        // Remove the executed order from pending orders
        this.portfolio.pendingLimitOrders = this.portfolio.pendingLimitOrders.filter(
          pending => pending.id !== order.id
        );
      } catch (error) {
        console.warn(`Failed to execute limit order ${order.id}:`, error);
        // Keep the order in pending state if execution fails
      }
    }
  }

  /**
   * Executes a specific limit order
   * @param order - The limit order to execute
   * @param executionPrice - The price at which to execute the order
   */
  private executeLimitOrder(order: ILimitOrder, executionPrice: number): void {
    this.executeMarketOrder(
      order.symbol,
      order.action,
      executionPrice,
      order.quantity,
      order.strategy,
      Date.now() // Use current timestamp for execution
    );
    
    // Update the last trade to mark it as a limit order execution
    const lastTrade = this.portfolio.trades[this.portfolio.trades.length - 1];
    if (lastTrade) {
      lastTrade.orderType = 'LIMIT';
    }
  }

  /**
   * Generates a unique order ID
   * @returns A unique order ID string
   */
  private generateOrderId(): string {
    return `LO_${++this.orderIdCounter}_${Date.now()}`;
  }

  /**
   * Cancels a pending limit order
   * @param orderId - The ID of the order to cancel
   * @returns True if the order was found and cancelled, false otherwise
   */
  public cancelLimitOrder(orderId: string): boolean {
    const orderIndex = this.portfolio.pendingLimitOrders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) {
      return false;
    }
    
    this.portfolio.pendingLimitOrders.splice(orderIndex, 1);
    return true;
  }

  /**
   * Gets all pending limit orders
   * @returns Array of pending limit orders
   */
  public getPendingLimitOrders(): ILimitOrder[] {
    return [...this.portfolio.pendingLimitOrders];
  }

  /**
   * Gets pending limit orders for a specific symbol
   * @param symbol - The trading symbol
   * @returns Array of pending limit orders for the symbol
   */
  public getPendingLimitOrdersBySymbol(symbol: string): ILimitOrder[] {
    return this.portfolio.pendingLimitOrders.filter(order => order.symbol === symbol);
  }

  /**
   * Updates market price for a symbol and executes any applicable limit orders
   * @param symbol - Trading symbol
   * @param price - Current market price
   */
  public updateMarketPrice(symbol: string, price: number): void {
    this.checkAndExecuteLimitOrders(symbol, price);
  }

  /**
   * Gets the current portfolio state
   * @returns The current portfolio
   */
  public getPortfolio(): IPortfolio {
    return {
      ...this.portfolio,
      positions: [...this.portfolio.positions],
      trades: [...this.portfolio.trades],
      pendingLimitOrders: [...this.portfolio.pendingLimitOrders],
    };
  }
}