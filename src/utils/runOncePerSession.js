/**
 * Runs a callback only once per browser session.
 *
 * FEATURES:
 * - Executes only on first visit in this session
 * - Prevents repeated calls on re-mounts or re-renders
 * - Optional logging for debugging
 *
 * @param {string} key - Unique key to identify this session task
 * @param {Function} callback - Function to execute once per session
 * @param {boolean} [debug=false] - Enable console logs
 */
export const runOncePerSession = ({ key, callback, debug = false }) => {
  try {
    // Validate input
    if (!key || typeof key !== "string") {
      console.warn("[runOncePerSession] Invalid key provided:", key);
      return;
    }
    if (typeof callback !== "function") {
      console.warn("[runOncePerSession] Callback must be a function");
      return;
    }

    const hasRun = sessionStorage.getItem(`runOnce:${key}`);

    if (debug) {
      console.log(
        `%c[runOncePerSession] Task Key: ${key}\nHas Run Before: ${!!hasRun}`,
        "color: #4caf50; font-weight: bold;"
      );
    }

    // Already executed this session → skip
    if (hasRun) return;

    // Mark as executed
    sessionStorage.setItem(`runOnce:${key}`, "true");

    // Run the callback
    callback();

  } catch (error) {
    console.error("[runOncePerSession] Error:", error);
  }
};
