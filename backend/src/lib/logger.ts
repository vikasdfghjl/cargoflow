import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import fs from 'node:fs';
import path from 'node:path';

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';
const configuredLevel = (process.env.LOG_LEVEL || '').toLowerCase();
const level = configuredLevel || (isProduction ? 'info' : 'debug');

type LogInfo = {
  level: string;
  message: string;
  timestamp?: string;
  stack?: string;
} & Record<string, unknown>;

const logFormat = format.printf((info) => {
  const { level, message, timestamp, stack, ...meta } = info as LogInfo;
  const base = {
    timestamp,
    level,
    message: stack || String(message),
    ...meta
  };
  return JSON.stringify(base);
});

const consoleFormat = format.combine(
  format.colorize({ all: true }),
  format.timestamp(),
  format.errors({ stack: true }),
  format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info as LogInfo;
    const details = Object.keys(meta).length ? `\nmeta: ${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} ${level}: ${stack || String(message)}${details}`;
  })
);

const transportList = [] as any[];

// Console transport for all envs (pretty in dev, JSON in prod CI)
transportList.push(
  new transports.Console({
    level: isProduction ? 'info' : 'debug',
    format: isProduction
      ? format.combine(format.timestamp(), format.errors({ stack: true }), logFormat)
      : consoleFormat,
    handleExceptions: true
  })
);

// File rotation only when not in test
if (env !== 'test') {
  // Ensure logs directory exists
  const logsDir = path.resolve(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  transportList.push(
    new DailyRotateFile({
      dirname: logsDir,
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '10m',
      maxFiles: '14d',
      level: 'info',
      format: format.combine(format.timestamp(), format.errors({ stack: true }), logFormat),
    })
  );

  transportList.push(
    new DailyRotateFile({
      dirname: logsDir,
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '10m',
      maxFiles: '30d',
      level: 'error',
      format: format.combine(format.timestamp(), format.errors({ stack: true }), logFormat),
    })
  );
}

export const logger = createLogger({
  level,
  format: format.combine(format.timestamp(), format.errors({ stack: true })),
  defaultMeta: {
    service: 'cargoflow-backend',
    env,
  },
  transports: transportList,
  exitOnError: false,
});

// Helper methods with typed metadata
export const log = {
  debug: (message: string, meta?: Record<string, unknown>) => logger.debug(message, meta),
  info: (message: string, meta?: Record<string, unknown>) => logger.info(message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => logger.warn(message, meta),
  error: (message: string | Error, meta?: Record<string, unknown>) => {
    if (message instanceof Error) {
      logger.error(message.message, { stack: message.stack, ...meta });
    } else {
      logger.error(message, meta);
    }
  },
};

export default logger;
