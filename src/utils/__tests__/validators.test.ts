import { validateWebhook } from '../validators';

describe('Webhook Validators', () => {
  describe('validateWebhook', () => {
    it('should validate a correct webhook payload', () => {
      const payload = {
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 50000,
        quantity: 0.1,
        strategy: 'SMA_CROSS',
        timestamp: 1625097600000,
      };

      const result = validateWebhook(payload);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should validate a market order with explicit orderType', () => {
      const payload = {
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 50000,
        quantity: 0.1,
        strategy: 'SMA_CROSS',
        timestamp: 1625097600000,
        orderType: 'MARKET',
      };

      const result = validateWebhook(payload);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should validate a limit order with limitPrice', () => {
      const payload = {
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 50000,
        quantity: 0.1,
        strategy: 'SMA_CROSS',
        timestamp: 1625097600000,
        orderType: 'LIMIT',
        limitPrice: 49000,
      };

      const result = validateWebhook(payload);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject a limit order without limitPrice', () => {
      const payload = {
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 50000,
        quantity: 0.1,
        strategy: 'SMA_CROSS',
        timestamp: 1625097600000,
        orderType: 'LIMIT',
        // Missing limitPrice
      };

      const result = validateWebhook(payload);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('LimitPrice is required and must be a number for limit orders');
    });

    it('should reject a payload with invalid orderType', () => {
      const payload = {
        symbol: 'BTCUSDT',
        action: 'BUY',
        price: 50000,
        quantity: 0.1,
        strategy: 'SMA_CROSS',
        timestamp: 1625097600000,
        orderType: 'INVALID',
      };

      const result = validateWebhook(payload);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('OrderType must be either MARKET or LIMIT');
    });

    it('should reject a payload with missing fields', () => {
      const payload = {
        symbol: 'BTCUSDT',
        action: 'BUY',
        // Missing price
        quantity: 0.1,
        strategy: 'SMA_CROSS',
        timestamp: 1625097600000,
      };

      const result = validateWebhook(payload);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Price must be a number');
    });

    it('should reject a payload with invalid action', () => {
      const payload = {
        symbol: 'BTCUSDT',
        action: 'HOLD', // Invalid action
        price: 50000,
        quantity: 0.1,
        strategy: 'SMA_CROSS',
        timestamp: 1625097600000,
      };

      const result = validateWebhook(payload);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Action must be either BUY or SELL');
    });

    it('should reject a non-object payload', () => {
      const result = validateWebhook('not an object');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Payload must be an object');
    });
  });
});