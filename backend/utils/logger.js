/**
 * Structured JSON logger for production-grade logging.
 * No external dependencies — uses console with structured format.
 */

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3, audit: 4 };
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'info'] || 1;

function formatEntry(level, message, context = {}) {
    return JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...context,
        pid: process.pid,
    });
}

const logger = {
    debug(message, context) {
        if (currentLevel <= LOG_LEVELS.debug) {
            console.debug(formatEntry('debug', message, context));
        }
    },

    info(message, context) {
        if (currentLevel <= LOG_LEVELS.info) {
            console.info(formatEntry('info', message, context));
        }
    },

    warn(message, context) {
        if (currentLevel <= LOG_LEVELS.warn) {
            console.warn(formatEntry('warn', message, context));
        }
    },

    error(message, context) {
        if (currentLevel <= LOG_LEVELS.error) {
            const entry = { ...context };
            if (context?.error instanceof Error) {
                entry.error = {
                    name: context.error.name,
                    message: context.error.message,
                    stack: process.env.NODE_ENV !== 'production' ? context.error.stack : undefined,
                };
            }
            console.error(formatEntry('error', message, entry));
        }
    },

    audit(message, context) {
        // Always log audit entries regardless of level
        console.info(formatEntry('audit', message, context));
    },
};

module.exports = logger;
