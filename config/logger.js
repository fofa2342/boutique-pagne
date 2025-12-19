// config/logger.js
import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  if (stack) {
    return `${timestamp} [${level}]: ${message}\n${stack}`;
  }
  return `${timestamp} [${level}]: ${message}`;
});

// Check if running on Vercel or similar serverless environment
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTIONS_WORKER_RUNTIME;

// Base transports (always include console)
const transports = [
  new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      consoleFormat
    )
  })
];

// Only add file transports if NOT in serverless environment
if (!isServerless && process.env.NODE_ENV !== 'production') {
  // Create logs directory if it doesn't exist (only in non-serverless)
  import('fs').then(fs => {
    if (!fs.existsSync('./logs')) {
      try {
        fs.mkdirSync('./logs', { recursive: true });
      } catch (err) {
        console.warn('Could not create logs directory:', err.message);
      }
    }
  });

  transports.push(
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    printf(({ level, message, timestamp, stack, ...metadata }) => {
      let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
      if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
      }
      if (stack) {
        msg += `\n${stack}`;
      }
      return msg;
    })
  ),
  transports,
  // Don't exit on error
  exitOnError: false
});

// Log environment info
if (isServerless) {
  logger.info('Running in serverless environment - file logging disabled');
}

export default logger;
