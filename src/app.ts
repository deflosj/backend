import express, { Express, Request } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
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

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const STAFF_ROLES = new Set(["ADMIN", "SUPERADMIN", "REFEREE"]);

/** Geldig JWT van iemand die op de toernooidag scores of teams beheert. */
const isStaffRequest = (req: Request): boolean => {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  if (scheme !== "Bearer" || !token) return false;
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] }) as { role?: string };
    return typeof payload.role === "string" && STAFF_ROLES.has(payload.role);
  } catch {
    return false;
  }
};

/**
 * Remt schrijfacties van anonieme bezoekers af. Lezen telt niet mee: de
 * publieke toernooipagina's en het tv-scherm verversen elke halve minuut en
 * komen via de Next-server allemaal van hetzelfde IP binnen. Ingelogde
 * beheerders en scheidsrechters tellen ook niet mee — op de toernooidag zitten
 * die samen op de wifi van de zaal.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => READ_METHODS.has(req.method) || isStaffRequest(req),
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

  // Achter een proxy (Railway): het echte bezoekers-IP uit X-Forwarded-For
  // halen, anders delen alle bezoekers één rate-limitteller.
  if (config.trustProxy) app.set("trust proxy", config.trustProxy);

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
  // Enkel het publieke contactformulier afremmen. Met app.use() telde elke
  // GET /contact/messages van de admin ook mee, waardoor het beheer na
  // twintig klikken een 429 kreeg.
  app.post(`${config.apiPrefix}/contact/messages`, contactLimiter);

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

// Vercel (Express zero-config) laadt dit bestand rechtstreeks en verwacht een
// default export met de app. Lokaal start src/index.ts de server zoals vroeger.
const vercelApp = createApp();
export default vercelApp;
