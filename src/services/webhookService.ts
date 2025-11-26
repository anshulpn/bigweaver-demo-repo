import { ITradingViewWebhook } from '../models/webhook.interface';
import { PaperTradingSystem } from '../trading/paperTradingSystem';
import { config } from '../config';

// Create a singleton instance of the paper trading system
const tradingSystem = new PaperTradingSystem({
  initialBalance: config.initialBalance,
  commission: config.commission,
});

/**
 * Get the singleton instance of the trading system
 * @returns The paper trading system instance
 */
export function getTradingSystemInstance(): PaperTradingSystem {
  return tradingSystem;
}

/**
 * Process a TradingView webhook and execute the corresponding paper trade
 * @param webhook - The validated webhook payload
 * @returns Result of the trade execution
 */
export async function processTradingViewWebhook(webhook: ITradingViewWebhook): Promise<unknown> {
  const orderType = webhook.orderType || 'MARKET';
  console.log(`Processing webhook for ${webhook.symbol}: ${webhook.action} ${orderType} order at ${webhook.price}`);
  
  // Execute the trade in the paper trading system
  const result = tradingSystem.executeTrade({
    symbol: webhook.symbol,
    action: webhook.action,
    price: webhook.price,
    quantity: webhook.quantity,
    strategy: webhook.strategy,
    timestamp: webhook.timestamp,
    orderType: webhook.orderType,
    limitPrice: webhook.limitPrice,
  });
  
  return result;
}