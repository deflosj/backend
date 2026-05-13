import config from "./config";
import { createLogger } from "./utils/logger";
import { createApp, startServer } from "./app";

const logger = createLogger(config.logLevel);

try {
  logger.info("Initializing VZW Backend");
  const app = createApp();
  startServer(app);
} catch (error) {
  logger.error("Failed to start server", error);
  process.exit(1);
}
