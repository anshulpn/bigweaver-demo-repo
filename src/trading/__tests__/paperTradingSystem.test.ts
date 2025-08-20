import { PaperTradingSystem } from '../paperTradingSystem';

describe('PaperTradingSystem', () => {
  let tradingSystem: PaperTradingSystem;
  
  beforeEach(() => {
    // Create a new trading system with 10000 initial balance and 0.1% commission
    tradingSystem = new PaperTradingSystem({
      initialBalance: 10000,
      commission: 0.1,
    });
  });
  
  it('should initialize with the correct balance', () => {
    const portfolio = tradingSystem.getPortfolio();
    expect(portfolio.balance).toBe(10000);
    expect(portfolio.positions).toHaveLength(0);
    expect(portfolio.trades).toHaveLength(0);
  });
  
  it('should execute a buy order correctly', () => {
    const trade = {
      symbol: 'BTCUSDT',
      action: 'BUY' as const,
      price: 50000,
      quantity: 0.1,
      strategy: 'TEST',
      timestamp: 1625097600000,
    };
    
    const portfolio = tradingSystem.executeTrade(trade);
    
    // Check balance (10000 - 5000 - 5 = 4995)
    // 5000 = price * quantity, 5 = commission
    expect(portfolio.balance).toBeCloseTo(4995, 2);
    expect(portfolio.positions).toHaveLength(1);
    expect(portfolio.trades).toHaveLength(1);
    
    const position = portfolio.positions[0];
    expect(position.symbol).toBe('BTCUSDT');
    expect(position.entryPrice).toBe(50000);
    expect(position.quantity).toBe(0.1);
  });
  
  it('should execute a sell order correctly', () => {
    // First buy
    tradingSystem.executeTrade({
      symbol: 'BTCUSDT',
      action: 'BUY',
      price: 50000,
      quantity: 0.1,
      strategy: 'TEST',
      timestamp: 1625097600000,
    });
    
    // Then sell
    const portfolio = tradingSystem.executeTrade({
      symbol: 'BTCUSDT',
      action: 'SELL',
      price: 55000, // 10% profit
      quantity: 0.1,
      strategy: 'TEST',
      timestamp: 1625097700000,
    });
    
    // Check balance (4995 + 5500 - 5.5 = 10489.5)
    // 5500 = new price * quantity, 5.5 = commission
    expect(portfolio.balance).toBeCloseTo(10489.5, 2);
    expect(portfolio.positions).toHaveLength(0);
    expect(portfolio.trades).toHaveLength(2);
  });
  
  it('should throw an error when buying with insufficient balance', () => {
    const trade = {
      symbol: 'BTCUSDT',
      action: 'BUY' as const,
      price: 100000,
      quantity: 1.1, // More than the balance can afford
      strategy: 'TEST',
      timestamp: 1625097600000,
    };
    
    expect(() => tradingSystem.executeTrade(trade)).toThrow('Insufficient balance');
  });
  
  it('should throw an error when selling a non-existent position', () => {
    const trade = {
      symbol: 'ETHUSDT', // We don't have this position
      action: 'SELL' as const,
      price: 3000,
      quantity: 1,
      strategy: 'TEST',
      timestamp: 1625097600000,
    };
    
    expect(() => tradingSystem.executeTrade(trade)).toThrow('No matching position found');
  });
});