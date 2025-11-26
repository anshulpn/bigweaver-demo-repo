/**
 * Interface for TradingView webhook payloads
 */
export interface ITradingViewWebhook {
  symbol: string;                                   // Trading pair or asset
  action: 'BUY' | 'SELL' | 'LIMIT_BUY' | 'LIMIT_SELL'; // Trade direction
  price: number;                                    // Entry/exit price or limit price
  quantity: number;                                 // Trade size
  strategy: string;                                 // Strategy identifier
  timestamp: number;                                // Event timestamp
  limitPrice?: number;                              // Limit price for limit orders (deprecated, use price field)
}