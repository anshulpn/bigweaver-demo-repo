/**
 * Interface for TradingView webhook payloads
 * 
 * TradingView sends POST requests with either "application/json" or "text/plain" content-type.
 * The webhook payload supports customizable JSON structure configured by users in TradingView.
 * 
 * This interface defines common fields used in TradingView webhooks, but supports flexible
 * JSON structure through an index signature to allow custom fields.
 * 
 * Common TradingView placeholders that may be used:
 * - {{ticker}} - The trading pair or asset symbol
 * - {{strategy.order.action}} - The order action (buy/sell)
 * - {{strategy.market_position}} - The market position (long/short/flat)
 * - {{strategy.order.contracts}} - Number of contracts/quantity
 * - {{close}}, {{open}}, {{high}}, {{low}} - Price data
 * - {{strategy.order.id}} - Order identifier
 * - {{strategy.order.comment}} - Order comment
 * 
 * @example
 * // Basic webhook payload
 * {
 *   "ticker": "BTCUSDT",
 *   "action": "buy",
 *   "price": 50000,
 *   "quantity": 0.1
 * }
 * 
 * @example
 * // Extended webhook payload with custom fields
 * {
 *   "symbol": "ETHUSDT",
 *   "action": "sell",
 *   "sentiment": "short",
 *   "price": 3000,
 *   "quantity": 1,
 *   "strategy": "RSI_DIVERGENCE",
 *   "timestamp": 1625097600000,
 *   "stop_loss": 3100,
 *   "take_profit": 2900
 * }
 */
export interface ITradingViewWebhook {
  // Core required fields for paper trading system
  /** Trading pair or asset symbol (e.g., "BTCUSDT", "AAPL") */
  symbol: string;
  
  /** Trade action/direction - must be either "BUY" or "SELL" */
  action: 'BUY' | 'SELL';
  
  /** Execution price for the trade */
  price: number;
  
  /** Trade size/quantity/contracts */
  quantity: number;
  
  /** Strategy identifier/name */
  strategy: string;
  
  /** Event timestamp (Unix timestamp in milliseconds) */
  timestamp: number;
  
  // Optional common TradingView fields
  /** Alternative field name for symbol (from {{ticker}} placeholder) */
  ticker?: string;
  
  /** Market position sentiment from strategy.market_position (e.g., "long", "short", "flat") */
  sentiment?: string;
  
  /** Alternative field name for quantity (from {{strategy.order.contracts}}) */
  contracts?: number;
  
  /** Open price of the bar */
  open?: number;
  
  /** High price of the bar */
  high?: number;
  
  /** Low price of the bar */
  low?: number;
  
  /** Close price of the bar (may be same as price) */
  close?: number;
  
  /** Order identifier from strategy */
  order_id?: string;
  
  /** Order comment/note from strategy */
  order_comment?: string;
  
  /** Time in force for the order (e.g., "GTC", "IOC", "FOK") */
  time_in_force?: string;
  
  /** Exchange name or identifier */
  exchange?: string;
  
  /** Bar/interval timeframe (e.g., "1h", "15m", "1D") */
  interval?: string;
  
  /** Trading volume on the bar */
  volume?: number;
  
  // Index signature to support custom user-defined fields
  /** 
   * Allow additional custom fields as TradingView supports flexible message formatting.
   * Users can define any custom fields in their alert message configuration.
   */
  [key: string]: string | number | boolean | undefined;
}