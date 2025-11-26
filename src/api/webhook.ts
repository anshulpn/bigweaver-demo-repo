import express, { Request, Response } from 'express';
import { validateWebhook } from '../utils/validators';
import { processTradingViewWebhook } from '../services/webhookService';
import { ITradingViewWebhook } from '../models/webhook.interface';

export const webhookRouter = express.Router();

/**
 * POST /api/webhook
 * Endpoint for receiving TradingView webhook events
 */
webhookRouter.post('/', async (req: Request, res: Response) => {
  try {
    // Validate the webhook payload
    const validationResult = validateWebhook(req.body);
    
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook payload',
        errors: validationResult.errors,
      });
    }

    // Process the webhook
    const webhook = req.body as ITradingViewWebhook;
    const result = await processTradingViewWebhook(webhook);

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});