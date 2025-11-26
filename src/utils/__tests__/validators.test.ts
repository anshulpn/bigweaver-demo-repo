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

    it('should validate limit order actions', () => {
      const limitBuyPayload = {
        symbol: 'BTCUSDT',
        action: 'LIMIT_BUY',
        price: 50000,
        quantity: 0.1,
        strategy: 'SMA_CROSS',
        timestamp: 1625097600000,
      };

      const limitSellPayload = {
        symbol: 'BTCUSDT',
        action: 'LIMIT_SELL',
        price: 55000,
        quantity: 0.1,
        strategy: 'SMA_CROSS',
        timestamp: 1625097600000,
      };

      const limitBuyResult = validateWebhook(limitBuyPayload);
      expect(limitBuyResult.valid).toBe(true);
      expect(limitBuyResult.errors).toBeUndefined();

      const limitSellResult = validateWebhook(limitSellPayload);
      expect(limitSellResult.valid).toBe(true);
      expect(limitSellResult.errors).toBeUndefined();
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
      expect(result.errors).toContain('Action must be one of: BUY, SELL, LIMIT_BUY, LIMIT_SELL');
    });

    it('should reject a non-object payload', () => {
      const result = validateWebhook('not an object');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Payload must be an object');
    });
  });
});