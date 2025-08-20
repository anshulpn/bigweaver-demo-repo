/**
 * Interface for TradingView webhook payloads
 */
export interface ITradingViewWebhook {
  symbol: string;           // Trading pair or asset
  action: 'BUY' | 'SELL';   // Trade direction
  price: number;            // Entry/exit price
  quantity: number;         // Trade size
  strategy: string;         // Strategy identifier
  timestamp: number;        // Event timestamp
}