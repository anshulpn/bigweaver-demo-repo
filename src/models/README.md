# Data Models

This directory contains TypeScript interfaces and type definitions for the Paper Trading Webpage application.

## TradingViewWebhook Interface

The `ITradingViewWebhook` interface defines the structure for incoming webhook POST requests from TradingView.

### Key Features

- **Flexible JSON Structure**: Supports customizable webhook payloads as configured by users in TradingView
- **Content-Type Support**: Handles both `application/json` and `text/plain` content types
- **Backward Compatible**: Maintains all existing required fields for the paper trading system
- **Extensible**: Includes index signature to support custom user-defined fields

### Required Fields

The following fields are required for the paper trading system to function correctly:

| Field | Type | Description |
|-------|------|-------------|
| `symbol` | `string` | Trading pair or asset symbol (e.g., "BTCUSDT", "AAPL") |
| `action` | `'BUY' \| 'SELL'` | Trade action/direction |
| `price` | `number` | Execution price for the trade |
| `quantity` | `number` | Trade size/quantity/contracts |
| `strategy` | `string` | Strategy identifier/name |
| `timestamp` | `number` | Event timestamp (Unix timestamp in milliseconds) |

### Optional Fields

Common TradingView placeholder fields that can be included:

| Field | Type | Description |
|-------|------|-------------|
| `ticker` | `string` | Alternative field name for symbol (from `{{ticker}}` placeholder) |
| `sentiment` | `string` | Market position sentiment (e.g., "long", "short", "flat") |
| `contracts` | `number` | Alternative field name for quantity (from `{{strategy.order.contracts}}`) |
| `open` | `number` | Open price of the bar |
| `high` | `number` | High price of the bar |
| `low` | `number` | Low price of the bar |
| `close` | `number` | Close price of the bar |
| `order_id` | `string` | Order identifier from strategy |
| `order_comment` | `string` | Order comment/note from strategy |
| `time_in_force` | `string` | Time in force for the order (e.g., "GTC", "IOC", "FOK") |
| `exchange` | `string` | Exchange name or identifier |
| `interval` | `string` | Bar/interval timeframe (e.g., "1h", "15m", "1D") |
| `volume` | `number` | Trading volume on the bar |

### Custom Fields

The interface supports any additional custom fields through an index signature. Users can define any custom fields in their TradingView alert message configuration.

### Common TradingView Placeholders

When configuring webhook alerts in TradingView, you can use these placeholders:

- `{{ticker}}` - The trading pair or asset symbol
- `{{strategy.order.action}}` - The order action (buy/sell)
- `{{strategy.market_position}}` - The market position (long/short/flat)
- `{{strategy.order.contracts}}` - Number of contracts/quantity
- `{{close}}`, `{{open}}`, `{{high}}`, `{{low}}` - Price data
- `{{strategy.order.id}}` - Order identifier
- `{{strategy.order.comment}}` - Order comment

### Usage Examples

#### Basic Webhook Payload

```json
{
  "symbol": "BTCUSDT",
  "action": "BUY",
  "price": 50000,
  "quantity": 0.1,
  "strategy": "SMA_CROSS",
  "timestamp": 1625097600000
}
```

#### Extended Webhook with Optional Fields

```json
{
  "symbol": "ETHUSDT",
  "action": "SELL",
  "sentiment": "short",
  "price": 3000,
  "quantity": 1,
  "strategy": "RSI_DIVERGENCE",
  "timestamp": 1625097600000,
  "ticker": "ETHUSDT",
  "open": 3010,
  "high": 3020,
  "low": 2995,
  "close": 3000,
  "volume": 1500000
}
```

#### Webhook with Custom Fields

```json
{
  "symbol": "AAPL",
  "action": "BUY",
  "price": 150.25,
  "quantity": 100,
  "strategy": "MOMENTUM_STRATEGY",
  "timestamp": 1625097600000,
  "stop_loss": 145.00,
  "take_profit": 160.00,
  "custom_indicator": 0.75,
  "risk_level": "medium"
}
```

### Implementation Notes

- The interface uses TypeScript strict mode
- All optional fields use the `?:` syntax
- The index signature `[key: string]: string | number | boolean | undefined` allows any additional properties
- The interface is validated using the `validateWebhook()` function in `src/utils/validators.ts`
- Only the required fields are validated; optional and custom fields are passed through

### Related Files

- **Interface Definition**: `src/models/webhook.interface.ts`
- **Validation**: `src/utils/validators.ts`
- **Webhook Handler**: `src/api/webhook.ts`
- **Processing Service**: `src/services/webhookService.ts`
- **Trading System**: `src/trading/paperTradingSystem.ts`
