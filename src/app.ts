import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import config from "./config";
import { createLogger } from "./utils/logger";
import { requestLogger, errorHandler, notFoundHandler } from "./middleware/errorHandler";
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import contentRouter from "./routes/content";
import membersRouter from "./routes/members";
import contactRouter from "./routes/contact";
import tournamentRouter from "./routes/tournament";
import registrationsRouter from "./routes/registrations";
import helpersPortalRouter from "./routes/helpersPortal";

const logger = createLogger(config.logLevel);

export const createApp = (): Express => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // Request logging middleware
  app.use(requestLogger);

  // Routes
  app.use("/", healthRouter);
  app.use(`${config.apiPrefix}`, healthRouter);
  app.use("/auth", authRouter);
  app.use(`${config.apiPrefix}/auth`, authRouter);
  app.use("/content", contentRouter);
  app.use(`${config.apiPrefix}/content`, contentRouter);
  app.use("/members", membersRouter);
  app.use(`${config.apiPrefix}/members`, membersRouter);
  app.use("/contact", contactRouter);
  app.use(`${config.apiPrefix}/contact`, contactRouter);
  app.use("/tournaments", tournamentRouter);
  app.use(`${config.apiPrefix}/tournaments`, tournamentRouter);
  app.use("/registrations", registrationsRouter);
  app.use(`${config.apiPrefix}/registrations`, registrationsRouter);
  app.use("/events", helpersPortalRouter);
  app.use(`${config.apiPrefix}/events`, helpersPortalRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
};

export const startServer = (app: Express): void => {
  const server = app.listen(config.port, config.host, (): void => {
    logger.info("Server started", {
      environment: config.nodeEnv,
      host: config.host,
      port: config.port,
      url: `http://${config.host}:${config.port}`,
      apiPrefix: config.apiPrefix,
    });
  });

  // Graceful shutdown
  process.on("SIGTERM", (): void => {
    logger.info("SIGTERM received, shutting down gracefully");
    server.close((): void => {
      logger.info("Server closed");
      process.exit(0);
    });
  });

  process.on("SIGINT", (): void => {
    logger.info("SIGINT received, shutting down gracefully");
    server.close((): void => {
      logger.info("Server closed");
      process.exit(0);
    });
  });
};
