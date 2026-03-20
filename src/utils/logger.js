// Custom Logging Utility
// Only prints logs in development mode, silent in production

export function log(...args) {
  if (process.env.NODE_ENV === "development") {
    console.log(...args);
  }
}

// Export additional log levels for flexibility
export const logger = {
  log: (...args) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[LOG]", ...args);
    }
  },
  warn: (...args) => {
    if (process.env.NODE_ENV === "development") {
      console.warn("[WARN]", ...args);
    }
  },
  error: (...args) => {
    // Errors are always logged in both development and production
    console.error("[ERROR]", ...args);
  },
  info: (...args) => {
    if (process.env.NODE_ENV === "development") {
      console.info("[INFO]", ...args);
    }
  },
};

export default log;
