/**
 * Winston Logger Configuration
 * Structured logging for production monitoring
 */

import winston from 'winston';

const { combine, timestamp, json, errors, printf, colorize } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Determine log level based on environment
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  defaultMeta: {
    service: 'jobautoflow-api',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        timestamp(),
        colorize(),
        process.env.NODE_ENV === 'production' ? json() : devFormat
      ),
    }),
  ],
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: combine(timestamp(), json()),
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    format: combine(timestamp(), json()),
  }));
}

// Stream for Morgan HTTP logging
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
