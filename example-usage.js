// Simple demonstration of limit orders functionality
// This file shows how the limit orders would work in practice

const { PaperTradingSystem } = require('./dist/trading/paperTradingSystem');

console.log('=== Paper Trading System - Limit Orders Demo ===\n');

// Create a new trading system
const trader = new PaperTradingSystem({
  initialBalance: 10000,
  commission: 0.1
});

console.log('Initial Portfolio:');
console.log('- Balance:', trader.getPortfolio().balance);
console.log('- Positions:', trader.getPortfolio().positions.length);
console.log('- Limit Orders:', trader.getPortfolio().limitOrders.length);
console.log();

// 1. Create a market buy order first
console.log('1. Creating market BUY order: BTCUSDT at $50,000 for 0.2 BTC');
trader.executeTrade({
  symbol: 'BTCUSDT',
  action: 'BUY',
  price: 50000,
  quantity: 0.2,
  strategy: 'INITIAL_BUY',
  timestamp: Date.now()
});

let portfolio = trader.getPortfolio();
console.log('After market buy:');
console.log('- Balance:', portfolio.balance);
console.log('- Positions:', portfolio.positions.length);
console.log('- Position quantity:', portfolio.positions[0]?.quantity || 0);
console.log();

// 2. Create limit sell orders (take profit)
console.log('2. Creating LIMIT_SELL orders for profit taking:');
console.log('   - Sell 0.1 BTC at $55,000');
console.log('   - Sell 0.1 BTC at $60,000');

trader.executeTrade({
  symbol: 'BTCUSDT',
  action: 'LIMIT_SELL',
  price: 55000,
  quantity: 0.1,
  strategy: 'TAKE_PROFIT_1',
  timestamp: Date.now()
});

trader.executeTrade({
  symbol: 'BTCUSDT',
  action: 'LIMIT_SELL',
  price: 60000,
  quantity: 0.1,
  strategy: 'TAKE_PROFIT_2',
  timestamp: Date.now()
});

portfolio = trader.getPortfolio();
console.log('After creating limit sell orders:');
console.log('- Balance:', portfolio.balance);
console.log('- Limit Orders:', portfolio.limitOrders.length);
portfolio.limitOrders.forEach((order, i) => {
  console.log(`  ${i+1}. ${order.action} ${order.quantity} ${order.symbol} at $${order.limitPrice}`);
});
console.log();

// 3. Create limit buy orders (buy the dip)
console.log('3. Creating LIMIT_BUY orders for buying dips:');
console.log('   - Buy 0.05 BTC at $48,000');
console.log('   - Buy 0.05 BTC at $45,000');

trader.executeTrade({
  symbol: 'BTCUSDT',
  action: 'LIMIT_BUY',
  price: 48000,
  quantity: 0.05,
  strategy: 'DIP_BUY_1',
  timestamp: Date.now()
});

trader.executeTrade({
  symbol: 'BTCUSDT',
  action: 'LIMIT_BUY',
  price: 45000,
  quantity: 0.05,
  strategy: 'DIP_BUY_2',
  timestamp: Date.now()
});

portfolio = trader.getPortfolio();
console.log('After creating limit buy orders:');
console.log('- Balance:', portfolio.balance);
console.log('- Total Limit Orders:', portfolio.limitOrders.length);
portfolio.limitOrders.forEach((order, i) => {
  console.log(`  ${i+1}. ${order.action} ${order.quantity} ${order.symbol} at $${order.limitPrice} (ID: ${order.id})`);
});
console.log();

// 4. Simulate price going up to trigger limit sells
console.log('4. Simulating price rise to $55,500 (should trigger first limit sell):');
trader.checkAndExecuteLimitOrders('BTCUSDT', 55500);

portfolio = trader.getPortfolio();
console.log('After price rise:');
console.log('- Balance:', portfolio.balance);
console.log('- Positions:', portfolio.positions[0]?.quantity || 0, 'BTC');
console.log('- Executed trades:', portfolio.trades.length);
console.log('- Remaining limit orders:', portfolio.limitOrders.length);
console.log();

// 5. Simulate price going down to trigger limit buys
console.log('5. Simulating price drop to $47,000 (should trigger first limit buy):');
trader.checkAndExecuteLimitOrders('BTCUSDT', 47000);

portfolio = trader.getPortfolio();
console.log('After price drop:');
console.log('- Balance:', portfolio.balance);
console.log('- Total BTC position:', portfolio.positions.reduce((sum, pos) => sum + pos.quantity, 0));
console.log('- Total executed trades:', portfolio.trades.length);
console.log('- Remaining limit orders:', portfolio.limitOrders.length);
console.log();

// 6. Show all trades
console.log('6. Complete trade history:');
portfolio.trades.forEach((trade, i) => {
  console.log(`  ${i+1}. ${trade.action} ${trade.quantity} ${trade.symbol} at $${trade.price} (Commission: $${trade.commission.toFixed(2)})`);
});
console.log();

// 7. Cancel remaining limit orders
console.log('7. Cancelling remaining limit orders:');
const remainingOrders = [...portfolio.limitOrders];
remainingOrders.forEach(order => {
  const cancelled = trader.cancelLimitOrder(order.id);
  console.log(`   - Cancelled ${order.action} order ${order.id}: ${cancelled ? 'Success' : 'Failed'}`);
});

portfolio = trader.getPortfolio();
console.log('Final portfolio state:');
console.log('- Balance:', portfolio.balance);
console.log('- Positions:', portfolio.positions.length);
console.log('- Limit Orders:', portfolio.limitOrders.length);
console.log('- Total Trades:', portfolio.trades.length);
console.log();

console.log('=== Demo completed successfully! ===');