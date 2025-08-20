/**
 * Application configuration
 */
export interface IConfig {
  port: number;
  environment: string;
  logLevel: string;
  initialBalance: number;
  commission: number;
}

export const config: IConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  initialBalance: parseFloat(process.env.INITIAL_BALANCE || '10000'),
  commission: parseFloat(process.env.COMMISSION || '0.1'),
};