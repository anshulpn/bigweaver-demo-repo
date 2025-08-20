import { ITradingViewWebhook } from '../models/webhook.interface';

/**
 * Validation result interface
 */
export interface IValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * Validates a TradingView webhook payload
 * @param payload - The webhook payload to validate
 * @returns Validation result
 */
export function validateWebhook(payload: unknown): IValidationResult {
  const errors: string[] = [];

  // Check if payload is an object
  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      errors: ['Payload must be an object'],
    };
  }

  const webhook = payload as Partial<ITradingViewWebhook>;

  // Check required fields
  if (!webhook.symbol) errors.push('Symbol is required');
  if (!webhook.action) errors.push('Action is required');
  if (webhook.action && !['BUY', 'SELL'].includes(webhook.action)) {
    errors.push('Action must be either BUY or SELL');
  }
  if (typeof webhook.price !== 'number') errors.push('Price must be a number');
  if (typeof webhook.quantity !== 'number') errors.push('Quantity must be a number');
  if (!webhook.strategy) errors.push('Strategy is required');
  if (typeof webhook.timestamp !== 'number') errors.push('Timestamp must be a number');

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}