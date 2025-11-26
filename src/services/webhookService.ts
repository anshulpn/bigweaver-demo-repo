import { ITradingViewWebhook } from '../models/webhook.interface';
import { PaperTradingSystem } from '../trading/paperTradingSystem';
import { LimitOrderService } from './limitOrderService';
import { config } from '../config';

// Create a singleton instance of the paper trading system
const tradingSystem = new PaperTradingSystem({
  initialBalance: config.initialBalance,
  commission: config.commission,
});

// Create limit order service
const limitOrderService = new LimitOrderService(tradingSystem);

/**
 * Process a TradingView webhook and execute the corresponding paper trade
 * @param webhook - The validated webhook payload
 * @returns Result of the trade execution
 */
export async function processTradingViewWebhook(webhook: ITradingViewWebhook): Promise<unknown> {
  console.log(`Processing webhook for ${webhook.symbol}: ${webhook.action} at ${webhook.price}`);
  
  let result;
  
  if (webhook.action === 'LIMIT_BUY' || webhook.action === 'LIMIT_SELL') {
    // Execute limit order creation
    result = tradingSystem.executeTrade({
      symbol: webhook.symbol,
      action: webhook.action,
      price: webhook.price,
      quantity: webhook.quantity,
      strategy: webhook.strategy,
      timestamp: webhook.timestamp,
    });
    
    console.log(`Created ${webhook.action} limit order for ${webhook.symbol} at ${webhook.price}`);
  } else {
    // Execute market order
    result = tradingSystem.executeTrade({
      symbol: webhook.symbol,
      action: webhook.action,
      price: webhook.price,
      quantity: webhook.quantity,
      strategy: webhook.strategy,
      timestamp: webhook.timestamp,
    });
    
    // After executing a market order, check if any limit orders should be triggered
    // by the current market price
    const limitOrderResult = limitOrderService.updateMarketPrice(webhook.symbol, webhook.price);
    
    if (limitOrderResult.executed > 0) {
      console.log(`Executed ${limitOrderResult.executed} limit orders for ${webhook.symbol} at price ${webhook.price}`);
      // Get updated portfolio after limit order executions
      result = tradingSystem.getPortfolio();
    }
  }
  
  return result;
}

/**
 * Get the limit order service instance
 * @returns The limit order service
 */
export function getLimitOrderService(): LimitOrderService {
  return limitOrderService;
}

/**
 * Get the trading system instance
 * @returns The paper trading system
 */
export function getTradingSystem(): PaperTradingSystem {
  return tradingSystem;
}