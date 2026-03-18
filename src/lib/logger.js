/**
 * @fileoverview Debug logger utility for Vivida extension.
 * Set DEBUG to true during development to enable verbose logging.
 * @module lib/logger
 */

const DEBUG = false;

/**
 * Logs a message to the console only when DEBUG mode is enabled.
 * In production builds, this is a no-op.
 * @param {...*} args - Arguments to pass to console.log
 * @returns {void}
 */
const log = (...args) => {
    if (DEBUG) console.log(...args);
};

export { log };
