/**
 * FRONTEND DIAGNOSTIC LOGGING MODULE
 * 
 * This module adds comprehensive logging to track the message lifecycle
 * and identify issues with unread tracking, delivery status, and sync on the frontend.
 * 
 * Usage:
 * import { logMessageEvent, logUnreadSync, logSocketEvent, logStatusChange } from '../utils/diagnosticLogger';
 */

const DIAGNOSTIC_MODE = import.meta.env.DEV;

// Color codes for console logging
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Create a diagnostic logger for a specific domain
 */
function createLogger(domain) {
  const prefix = colors.cyan + '[DIAG-FRONTEND]' + colors.reset + ' ' + colors.magenta + `[${domain}]` + colors.reset;
  
  return {
    info: (message, data = {}) => {
      if (!DIAGNOSTIC_MODE) return;
      console.log(`${prefix} ℹ️ ${message}`, data);
    },
    warn: (message, data = {}) => {
      if (!DIAGNOSTIC_MODE) return;
      console.warn(`${prefix} ⚠️ ${message}`, data);
    },
    error: (message, data = {}) => {
      console.error(`${prefix} ❌ ${message}`, data);
    },
    success: (message, data = {}) => {
      if (!DIAGNOSTIC_MODE) return;
      console.log(`${prefix} ✅ ${message}`, data);
    },
    flow: (step, data = {}) => {
      if (!DIAGNOSTIC_MODE) return;
      console.log(`${prefix} ➡️  ${step}`, data);
    },
  };
}

// Domain-specific loggers
const messageLogger = createLogger('MESSAGE');
const unreadLogger = createLogger('UNREAD');
const socketLogger = createLogger('SOCKET');
const statusLogger = createLogger('STATUS');
const syncLogger = createLogger('SYNC');
const offlineLogger = createLogger('OFFLINE');

/**
 * Log message lifecycle event
 */
function logMessageEvent(event, messageData, context = {}) {
  messageLogger.flow(event, {
    messageId: messageData?._id || messageData?.id || messageData?.tempId,
    chatId: messageData?.chatId,
    from: messageData?.from_user_id,
    to: messageData?.to_user_id,
    status: messageData?.status,
    ...context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log unread count sync operation
 */
function logUnreadSync(operation, data, frontendCount, backendCount = null) {
  if (backendCount !== null && frontendCount !== backendCount) {
    unreadLogger.warn(`MISMATCH: frontend=${frontendCount}, backend=${backendCount}`, {
      operation,
      ...data,
      timestamp: new Date().toISOString(),
    });
  } else {
    unreadLogger.flow(operation, {
      frontendCount,
      backendCount,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Log socket event
 */
function logSocketEvent(eventName, payload, direction = 'receive') {
  socketLogger.flow(`${direction === 'emit' ? '→' : '←'} ${eventName}`, payload);
}

/**
 * Log message status change
 */
function logStatusChange(messageId, oldStatus, newStatus, context = {}) {
  statusLogger.flow(`Status: ${oldStatus} → ${newStatus}`, {
    messageId,
    ...context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log offline queue operation
 */
function logOfflineQueue(operation, messages, context = {}) {
  offlineLogger.flow(operation, {
    messageCount: messages?.length || 0,
    ...context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log component lifecycle
 */
function logComponentEvent(componentName, event, data = {}) {
  messageLogger.flow(`[${componentName}] ${event}`, {
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log network request
 */
function logNetworkRequest(operation, endpoint, data = {}, response = null) {
  if (!DIAGNOSTIC_MODE) return;
  
  const status = response?.status;
  const prefix = status >= 200 && status < 300 ? '✅' : '❌';
  
  console.log(`${colors.blue}[NETWORK]${colors.reset} ${prefix} ${operation} ${endpoint}`, {
    request: data,
    response: response?.data || response,
    status,
    timestamp: new Date().toISOString(),
  });
}

export {
  createLogger,
  messageLogger,
  unreadLogger,
  socketLogger,
  statusLogger,
  syncLogger,
  offlineLogger,
  logMessageEvent,
  logUnreadSync,
  logSocketEvent,
  logStatusChange,
  logOfflineQueue,
  logComponentEvent,
  logNetworkRequest,
  DIAGNOSTIC_MODE,
};
