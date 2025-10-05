// lib/logger.ts - Structured logging with Winston
// Use this instead of console.log for production-ready logging

import winston from 'winston';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level (for console output)
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston to use our colors
winston.addColors(colors);

// Define format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Define which transports to use
const transports: winston.transport[] = [];

// Always log to console in development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// In production, use JSON format for log aggregation services
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.Console({
      format: format,
    })
  );
  
  // Also log to file in production
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: format,
    })
  );
  
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: format,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  levels,
  format,
  transports,
  // Don't exit on error
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logging middleware
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger;
