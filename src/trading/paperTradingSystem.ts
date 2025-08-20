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
}

/**
 * Paper Trading System implementation
 * Simulates trading without using real money
 */
export class PaperTradingSystem {
  private portfolio: IPortfolio;
  private readonly commission: number;

  /**
   * Creates a new PaperTradingSystem
   * @param config - Configuration for the paper trading system
   */
  constructor(config: IPaperTradingConfig) {
    this.portfolio = {
      balance: config.initialBalance,
      positions: [],
      trades: [],
    };
    this.commission = config.commission;
  }

  /**
   * Executes a paper trade based on the webhook data
   * @param trade - The trade to execute
   * @returns The updated portfolio
   */
  public executeTrade(trade: ITradingViewWebhook): IPortfolio {
    const { symbol, action, price, quantity, strategy, timestamp } = trade;
    
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
      
      // Calculate profit/loss
      const positionValue = position.entryPrice * quantity;
      const currentValue = price * quantity;
      const pnl = currentValue - positionValue - commissionAmount;
      
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
    };
  }
}