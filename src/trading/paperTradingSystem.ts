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
  limitOrders: ILimitOrder[];
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
  action: 'BUY' | 'SELL' | 'LIMIT_BUY' | 'LIMIT_SELL';
  price: number;
  quantity: number;
  timestamp: number;
  strategy: string;
  commission: number;
}

/**
 * Limit order interface representing a pending limit order
 */
export interface ILimitOrder {
  id: string;
  symbol: string;
  action: 'LIMIT_BUY' | 'LIMIT_SELL';
  limitPrice: number;
  quantity: number;
  timestamp: number;
  strategy: string;
  expiryTimestamp?: number;
}

/**
 * Paper Trading System implementation
 * Simulates trading without using real money
 */
export class PaperTradingSystem {
  private portfolio: IPortfolio;
  private readonly commission: number;
  private orderIdCounter: number;

  /**
   * Creates a new PaperTradingSystem
   * @param config - Configuration for the paper trading system
   */
  constructor(config: IPaperTradingConfig) {
    this.portfolio = {
      balance: config.initialBalance,
      positions: [],
      trades: [],
      limitOrders: [],
    };
    this.commission = config.commission;
    this.orderIdCounter = 1;
  }

  /**
   * Executes a paper trade based on the webhook data
   * @param trade - The trade to execute
   * @returns The updated portfolio
   */
  public executeTrade(trade: ITradingViewWebhook): IPortfolio {
    const { symbol, action, price, quantity, strategy, timestamp } = trade;
    
    // Handle limit orders differently
    if (action === 'LIMIT_BUY' || action === 'LIMIT_SELL') {
      return this.createLimitOrder(trade);
    }
    
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
      
      // Calculate current value
      const currentValue = price * quantity;
      
      // Update balance
      this.portfolio.balance += currentValue - commissionAmount;
      
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
    });
    
    return this.getPortfolio();
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
      limitOrders: [...this.portfolio.limitOrders],
    };
  }

  /**
   * Creates a new limit order
   * @param trade - The limit order to create
   * @returns The updated portfolio
   */
  private createLimitOrder(trade: ITradingViewWebhook): IPortfolio {
    const { symbol, action, price, quantity, strategy, timestamp } = trade;
    
    if (action !== 'LIMIT_BUY' && action !== 'LIMIT_SELL') {
      throw new Error('Invalid action for limit order');
    }

    // For limit buy orders, check if we have enough balance (reserved for execution)
    if (action === 'LIMIT_BUY') {
      const tradeValue = price * quantity;
      const commissionAmount = tradeValue * (this.commission / 100);
      
      if (this.portfolio.balance < tradeValue + commissionAmount) {
        throw new Error('Insufficient balance to create limit buy order');
      }
      
      // Reserve the funds by reducing balance
      this.portfolio.balance -= (tradeValue + commissionAmount);
    }
    
    // For limit sell orders, check if we have enough position
    if (action === 'LIMIT_SELL') {
      const totalPosition = this.portfolio.positions
        .filter(pos => pos.symbol === symbol)
        .reduce((total, pos) => total + pos.quantity, 0);
        
      const totalLimitSellOrders = this.portfolio.limitOrders
        .filter(order => order.symbol === symbol && order.action === 'LIMIT_SELL')
        .reduce((total, order) => total + order.quantity, 0);
        
      if (totalPosition < quantity + totalLimitSellOrders) {
        throw new Error('Insufficient position to create limit sell order');
      }
    }

    // Create the limit order
    const limitOrder: ILimitOrder = {
      id: `limit_${this.orderIdCounter++}`,
      symbol,
      action,
      limitPrice: price,
      quantity,
      timestamp,
      strategy,
    };

    this.portfolio.limitOrders.push(limitOrder);
    
    return this.getPortfolio();
  }

  /**
   * Checks and executes limit orders based on current market price
   * @param symbol - The symbol to check
   * @param currentPrice - The current market price
   * @returns The updated portfolio
   */
  public checkAndExecuteLimitOrders(symbol: string, currentPrice: number): IPortfolio {
    const ordersToExecute = this.portfolio.limitOrders.filter(order => {
      if (order.symbol !== symbol) return false;
      
      if (order.action === 'LIMIT_BUY' && currentPrice <= order.limitPrice) {
        return true;
      }
      
      if (order.action === 'LIMIT_SELL' && currentPrice >= order.limitPrice) {
        return true;
      }
      
      return false;
    });

    // Execute matching limit orders
    for (const order of ordersToExecute) {
      try {
        this.executeLimitOrder(order, currentPrice);
      } catch (error) {
        console.error(`Failed to execute limit order ${order.id}:`, error);
        // Remove the failed order
        this.cancelLimitOrder(order.id);
      }
    }

    return this.getPortfolio();
  }

  /**
   * Executes a specific limit order
   * @param order - The limit order to execute
   * @param executionPrice - The price at which to execute the order
   */
  private executeLimitOrder(order: ILimitOrder, executionPrice: number): void {
    const { symbol, action, quantity, strategy } = order;
    const tradeValue = executionPrice * quantity;
    const commissionAmount = tradeValue * (this.commission / 100);

    if (action === 'LIMIT_BUY') {
      // Funds were already reserved when the order was created
      // Add position
      this.portfolio.positions.push({
        symbol,
        entryPrice: executionPrice,
        quantity,
        timestamp: Date.now(),
        strategy,
      });
      
      // Note: Balance was already reduced when limit order was created
      // If execution price is lower than limit price, refund the difference
      const limitValue = order.limitPrice * quantity;
      const limitCommission = limitValue * (this.commission / 100);
      const actualCost = tradeValue + commissionAmount;
      const reservedAmount = limitValue + limitCommission;
      
      if (reservedAmount > actualCost) {
        this.portfolio.balance += (reservedAmount - actualCost);
      }
    } else if (action === 'LIMIT_SELL') {
      // Find and reduce position
      const positionIndex = this.portfolio.positions.findIndex(
        (pos) => pos.symbol === symbol && pos.quantity >= quantity
      );
      
      if (positionIndex === -1) {
        throw new Error(`No matching position found for limit sell order`);
      }
      
      const position = this.portfolio.positions[positionIndex];
      
      // Update balance
      this.portfolio.balance += tradeValue - commissionAmount;
      
      // Update position
      if (position.quantity === quantity) {
        this.portfolio.positions.splice(positionIndex, 1);
      } else {
        this.portfolio.positions[positionIndex].quantity -= quantity;
      }
    }

    // Record the trade
    this.portfolio.trades.push({
      symbol,
      action,
      price: executionPrice,
      quantity,
      timestamp: Date.now(),
      strategy,
      commission: commissionAmount,
    });

    // Remove the executed limit order
    this.portfolio.limitOrders = this.portfolio.limitOrders.filter(o => o.id !== order.id);
  }

  /**
   * Cancels a limit order by ID
   * @param orderId - The ID of the order to cancel
   * @returns True if order was cancelled, false if not found
   */
  public cancelLimitOrder(orderId: string): boolean {
    const orderIndex = this.portfolio.limitOrders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) {
      return false;
    }
    
    const order = this.portfolio.limitOrders[orderIndex];
    
    // If it's a limit buy order, refund the reserved funds
    if (order.action === 'LIMIT_BUY') {
      const tradeValue = order.limitPrice * order.quantity;
      const commissionAmount = tradeValue * (this.commission / 100);
      this.portfolio.balance += (tradeValue + commissionAmount);
    }
    
    // Remove the order
    this.portfolio.limitOrders.splice(orderIndex, 1);
    
    return true;
  }

  /**
   * Gets all active limit orders
   * @returns Array of active limit orders
   */
  public getLimitOrders(): ILimitOrder[] {
    return [...this.portfolio.limitOrders];
  }

  /**
   * Gets limit orders for a specific symbol
   * @param symbol - The symbol to filter by
   * @returns Array of limit orders for the symbol
   */
  public getLimitOrdersBySymbol(symbol: string): ILimitOrder[] {
    return this.portfolio.limitOrders.filter(order => order.symbol === symbol);
  }
}