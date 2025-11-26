/**
 * Interface for TradingView webhook payloads
 */
export interface ITradingViewWebhook {
  symbol: string;           // Trading pair or asset
  action: 'BUY' | 'SELL';   // Trade direction
  price: number;            // Entry/exit price for market orders, current market price for limit orders
  quantity: number;         // Trade size
  strategy: string;         // Strategy identifier
  timestamp: number;        // Event timestamp
  orderType?: 'MARKET' | 'LIMIT'; // Order type (defaults to MARKET for backward compatibility)
  limitPrice?: number;      // Limit price for limit orders (required when orderType is LIMIT)
}