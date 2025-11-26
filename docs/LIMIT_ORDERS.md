# Limit Orders Documentation

## Overview

Limit orders are a powerful feature that allows you to automatically execute trades when the market reaches a specified price. Unlike market orders that execute immediately at the current price, limit orders wait for your target price before executing.

## Types of Limit Orders

### LIMIT_BUY
Creates a buy order that executes when the market price drops to or below the specified limit price.

**Use Cases:**
- Buying the dip: Set a limit buy below the current price to catch price drops
- Dollar-cost averaging: Place multiple limit buys at different price levels
- Risk management: Enter positions only at favorable prices

**Example:**
```typescript
{
  symbol: 'BTCUSDT',
  action: 'LIMIT_BUY',
  price: 48000,      // Will buy when BTC drops to $48,000 or below
  quantity: 0.1,
  strategy: 'DIP_BUYER',
  timestamp: Date.now()
}
```

### LIMIT_SELL
Creates a sell order that executes when the market price rises to or above the specified limit price.

**Use Cases:**
- Taking profits: Set a limit sell above the current price to lock in gains
- Stop-loss alternative: Exit positions at predetermined price levels
- Automated trading: Let the system manage exits while you're away

**Example:**
```typescript
{
  symbol: 'BTCUSDT',
  action: 'LIMIT_SELL',
  price: 55000,      // Will sell when BTC rises to $55,000 or above
  quantity: 0.1,
  strategy: 'PROFIT_TAKER',
  timestamp: Date.now()
}
```

## How Limit Orders Work

### Order Creation
1. **LIMIT_BUY**: When you create a limit buy order, the required funds (price × quantity + commission) are reserved from your balance immediately. This ensures the order can be executed when triggered.

2. **LIMIT_SELL**: When you create a limit sell order, the system verifies you have sufficient position to sell. The position remains in your portfolio until the order executes.

### Order Execution
Limit orders are checked for execution in two scenarios:

1. **Automatic Execution**: When a market order is executed, the system automatically checks all limit orders for that symbol to see if any should be triggered by the new market price.

2. **Manual Price Check**: You can manually trigger a price check via the API endpoint, which is useful for external price feeds or scheduled checks.

### Execution Conditions
- **LIMIT_BUY**: Executes when `currentPrice <= limitPrice`
- **LIMIT_SELL**: Executes when `currentPrice >= limitPrice`

### Price Improvement
When a limit buy order is executed at a price lower than the limit price, the difference is refunded to your balance. For example:
- Limit buy at $50,000 reserves $5,005 (including 0.1% commission)
- Market drops to $48,000
- Order executes at $48,000, costing $4,804.80
- You receive a refund of $200.20

## API Reference

### Creating Limit Orders

Use the standard webhook endpoint with LIMIT_BUY or LIMIT_SELL action:

```bash
POST /api/webhook
Content-Type: application/json

{
  "symbol": "BTCUSDT",
  "action": "LIMIT_BUY",
  "price": 48000,
  "quantity": 0.1,
  "strategy": "MY_STRATEGY",
  "timestamp": 1625097600000
}
```

### Viewing Limit Orders

**Get all active limit orders:**
```bash
GET /api/limit-orders
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 2,
    "orders": [
      {
        "id": "limit_1",
        "symbol": "BTCUSDT",
        "action": "LIMIT_BUY",
        "limitPrice": 48000,
        "quantity": 0.1,
        "timestamp": 1625097600000,
        "strategy": "DIP_BUYER"
      }
    ]
  }
}
```

**Get limit orders for a specific symbol:**
```bash
GET /api/limit-orders/BTCUSDT
```

### Cancelling Limit Orders

```bash
DELETE /api/limit-orders/limit_1
```

**Response:**
```json
{
  "success": true,
  "message": "Limit order limit_1 cancelled successfully"
}
```

**Note:** When a limit buy order is cancelled, the reserved funds are returned to your balance.

### Manual Price Check

Trigger a price check for all limit orders of a symbol:

```bash
POST /api/limit-orders/check-price
Content-Type: application/json

{
  "symbol": "BTCUSDT",
  "price": 49000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Checked limit orders for BTCUSDT at price 49000",
  "data": {
    "executed": 2,
    "remaining": 1
  }
}
```

## Programmatic Usage

### TypeScript/JavaScript

```typescript
import { PaperTradingSystem } from './trading/paperTradingSystem';

const trader = new PaperTradingSystem({
  initialBalance: 10000,
  commission: 0.1
});

// Create a limit buy order
const portfolio1 = trader.executeTrade({
  symbol: 'BTCUSDT',
  action: 'LIMIT_BUY',
  price: 48000,
  quantity: 0.1,
  strategy: 'DIP_BUYER',
  timestamp: Date.now()
});

console.log('Limit orders:', portfolio1.limitOrders);
console.log('Reserved balance:', 10000 - portfolio1.balance);

// Check if market price triggers any orders
const portfolio2 = trader.checkAndExecuteLimitOrders('BTCUSDT', 47500);
console.log('Positions after execution:', portfolio2.positions);

// Get all limit orders
const allOrders = trader.getLimitOrders();
console.log('Active orders:', allOrders);

// Get limit orders for a specific symbol
const btcOrders = trader.getLimitOrdersBySymbol('BTCUSDT');

// Cancel a specific order
const cancelled = trader.cancelLimitOrder('limit_1');
if (cancelled) {
  console.log('Order cancelled successfully');
}
```

## Best Practices

### Order Placement
1. **Set Realistic Prices**: Place limit orders at prices that are likely to be reached based on market analysis
2. **Use Multiple Orders**: Scale in/out of positions with multiple limit orders at different price levels
3. **Monitor Balance**: Ensure you have sufficient balance before creating limit buy orders
4. **Check Positions**: Verify you have enough position before creating limit sell orders

### Risk Management
1. **Position Sizing**: Use appropriate quantities based on your account size
2. **Limit Order Laddering**: Place multiple orders at different price levels to average your entry/exit
3. **Regular Review**: Periodically review and cancel outdated limit orders
4. **Commission Awareness**: Remember that each limit order execution incurs commission fees

### Common Patterns

**Buy the Dip Strategy:**
```typescript
// Place multiple limit buys at different support levels
trader.executeTrade({
  symbol: 'BTCUSDT',
  action: 'LIMIT_BUY',
  price: 48000,
  quantity: 0.05,
  strategy: 'SUPPORT_LEVEL_1',
  timestamp: Date.now()
});

trader.executeTrade({
  symbol: 'BTCUSDT',
  action: 'LIMIT_BUY',
  price: 46000,
  quantity: 0.05,
  strategy: 'SUPPORT_LEVEL_2',
  timestamp: Date.now()
});
```

**Take Profit Ladder:**
```typescript
// Sell position in stages as price rises
trader.executeTrade({
  symbol: 'BTCUSDT',
  action: 'LIMIT_SELL',
  price: 55000,
  quantity: 0.05,
  strategy: 'TP_LEVEL_1',
  timestamp: Date.now()
});

trader.executeTrade({
  symbol: 'BTCUSDT',
  action: 'LIMIT_SELL',
  price: 60000,
  quantity: 0.05,
  strategy: 'TP_LEVEL_2',
  timestamp: Date.now()
});
```

## Limitations and Considerations

1. **No Partial Fills**: Orders execute completely or not at all. Partial fills are not supported.

2. **Price Checks**: Limit orders are only checked when:
   - A market order is executed for the same symbol
   - A manual price check is triggered via API
   
3. **No Expiration**: Limit orders remain active until executed or manually cancelled. Future versions may add expiration timestamps.

4. **Commission on Creation**: For limit buy orders, commission is calculated and reserved when the order is created, not when executed.

5. **Single Symbol Checks**: Price checks are per-symbol. To check multiple symbols, make separate API calls.

## Error Handling

Common errors when working with limit orders:

### Insufficient Balance
```json
{
  "success": false,
  "message": "Insufficient balance to create limit buy order"
}
```
**Solution:** Ensure your balance is sufficient to cover the order value plus commission.

### Insufficient Position
```json
{
  "success": false,
  "message": "Insufficient position to create limit sell order"
}
```
**Solution:** Verify you have enough position quantity before creating a limit sell order.

### Order Not Found
```json
{
  "success": false,
  "message": "Limit order limit_123 not found"
}
```
**Solution:** The order may have already been executed or cancelled. Check active orders first.

## Testing

The limit orders feature includes comprehensive test coverage. Run tests with:

```bash
npm test
```

Key test scenarios covered:
- Creating limit buy and sell orders
- Executing orders when price conditions are met
- Cancelling orders and refunding reserved funds
- Handling insufficient balance/position errors
- Multiple simultaneous limit orders
- Price improvement on execution

## Future Enhancements

Planned improvements to the limit orders feature:

1. **Order Expiration**: Add optional expiration timestamps to auto-cancel old orders
2. **Order Types**: Support for stop-loss, stop-limit, and trailing stop orders
3. **Partial Fills**: Enable partial order execution for large orders
4. **Order Priority**: Implement FIFO or price-time priority for order execution
5. **Advanced Conditions**: Support for more complex trigger conditions
6. **Order Modification**: Allow updating limit price without cancelling and recreating
7. **Bulk Operations**: API endpoints for bulk order management
8. **Real-time Notifications**: Webhooks or WebSocket notifications when orders execute

## Support and Feedback

For questions, issues, or feature requests related to limit orders:
- Check the main README.md for general setup and usage
- Review test files for usage examples
- Submit issues via the project's issue tracker
- Contribute improvements via pull requests
