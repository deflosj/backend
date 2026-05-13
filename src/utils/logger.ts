interface Logger {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, error?: Error | unknown) => void;
}

const getLogLevel = (level: string): number => {
  const levels: Record<string, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };
  return levels[level] || levels.info;
};

export const createLogger = (currentLevel: string): Logger => {
  const currentLevelNum = getLogLevel(currentLevel);

  return {
    debug: (message: string, data?: unknown): void => {
      if (getLogLevel("debug") >= currentLevelNum) {
        console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data || "");
      }
    },
    info: (message: string, data?: unknown): void => {
      if (getLogLevel("info") >= currentLevelNum) {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || "");
      }
    },
    warn: (message: string, data?: unknown): void => {
      if (getLogLevel("warn") >= currentLevelNum) {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || "");
      }
    },
    error: (message: string, error?: Error | unknown): void => {
      if (getLogLevel("error") >= currentLevelNum) {
        console.error(
          `[ERROR] ${new Date().toISOString()} - ${message}`,
          error instanceof Error ? error.message : error || ""
        );
      }
    },
  };
};
