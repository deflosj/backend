import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import config from "./config";
import { createLogger } from "./utils/logger";
import { requestLogger, errorHandler, notFoundHandler } from "./middleware/errorHandler";
import healthRouter from "./routes/health.routes";
import authRouter from "./routes/auth.routes";
import contentRouter from "./routes/content.routes";
import membersRouter from "./routes/members.routes";
import contactRouter from "./routes/contact.routes";
import tournamentRouter from "./routes/tournament.routes";
import registrationsRouter from "./routes/registrations.routes";
import helpersPortalRouter from "./routes/helpersPortal.routes";
import shiftsRouter from "./routes/shifts.routes";
import inviteCodesRouter from "./routes/inviteCodes.routes";
import rolesRouter from "./routes/roles.routes";

const logger = createLogger(config.logLevel);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

export const createApp = (): Express => {
  const app = express();

  // Security middleware — explicit CSP for a pure API (no browser resources served)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ limit: "100kb", extended: true }));

  // Request logging middleware
  app.use(requestLogger);

  // Rate limiting
  app.use(globalLimiter);
  app.use(`${config.apiPrefix}/auth/login`, authLimiter);
  app.use(`${config.apiPrefix}/auth/register`, authLimiter);
  app.use(`${config.apiPrefix}/auth/validate-invite`, authLimiter);
  app.use(`${config.apiPrefix}/contact`, contactLimiter);

  // Routes
  app.use(`${config.apiPrefix}`, healthRouter);
  app.use(`${config.apiPrefix}/auth`, authRouter);
  app.use(`${config.apiPrefix}/content`, contentRouter);
  app.use(`${config.apiPrefix}/members`, membersRouter);
  app.use(`${config.apiPrefix}/contact`, contactRouter);
  app.use(`${config.apiPrefix}/tournaments`, tournamentRouter);
  app.use(`${config.apiPrefix}/registrations`, registrationsRouter);
  app.use(`${config.apiPrefix}/events`, helpersPortalRouter);
  app.use(`${config.apiPrefix}/events`, shiftsRouter);
  app.use(`${config.apiPrefix}/invite-codes`, inviteCodesRouter);
  app.use(`${config.apiPrefix}/roles`, rolesRouter);

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
