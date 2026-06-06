import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middleware/auth";
import { requireAccess, requireRole } from "../middleware/authorizeRole";
import { errorHandler, notFoundHandler, requestLogger } from "../middleware/errorHandler";
import config from "../config";
import { HttpError } from "../utils/httpError";

describe("requireAuth middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = { headers: {} };
    res = {};
    next = jest.fn();
  });

  it("calls next when valid bearer token is provided", () => {
    const token = jwt.sign(
      {
        email: "user@example.com",
        username: "user",
        role: "MEMBER",
      },
      config.jwtSecret,
      { subject: "1" }
    );

    req.headers = { authorization: `Bearer ${token}` };
    requireAuth(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.authUser).toEqual({
      id: 1,
      email: "user@example.com",
      username: "user",
      role: "MEMBER",
    });
  });

  it("rejects missing authorization header", () => {
    req.headers = {};
    requireAuth(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "Authorization token is required",
      })
    );
    expect(req.authUser).toBeUndefined();
  });

  it("rejects malformed bearer token", () => {
    req.headers = { authorization: "InvalidBearer token" };
    requireAuth(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "Authorization token is required",
      })
    );
  });

  it("rejects invalid signature", () => {
    req.headers = { authorization: "Bearer invalid.token.here" };
    requireAuth(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "Invalid or expired token",
      })
    );
  });

  it("rejects token with invalid userId in sub", () => {
    const token = jwt.sign(
      {
        email: "user@example.com",
        username: "user",
        role: "MEMBER",
      },
      config.jwtSecret,
      { subject: "invalid" }
    );

    req.headers = { authorization: `Bearer ${token}` };
    requireAuth(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "Invalid token payload",
      })
    );
  });

  it("parses numeric userId from subject", () => {
    const token = jwt.sign(
      {
        email: "admin@example.com",
        username: "admin",
        role: "ADMIN",
      },
      config.jwtSecret,
      { subject: "42" }
    );

    req.headers = { authorization: `Bearer ${token}` };
    requireAuth(req as Request, res as Response, next);

    expect(req.authUser?.id).toBe(42);
  });
});

describe("requireRole middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = {};
    next = jest.fn();
  });

  it("calls next when user has required role", () => {
    req.authUser = {
      id: 1,
      email: "admin@example.com",
      username: "admin",
      role: "ADMIN",
    };

    const middleware = requireRole("ADMIN", "CAPTAIN");
    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("rejects when user lacks required role", () => {
    req.authUser = {
      id: 1,
      email: "member@example.com",
      username: "member",
      role: "MEMBER",
    };

    const middleware = requireRole("ADMIN", "CAPTAIN");
    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: "Insufficient permissions",
      })
    );
  });

  it("rejects missing authUser", () => {
    req.authUser = undefined;

    const middleware = requireRole("ADMIN");
    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "Authorization token is required",
      })
    );
  });

  it("allows any of multiple allowed roles", () => {
    const roles = ["ADMIN", "CAPTAIN", "MEMBER"] as const;

    roles.forEach((role) => {
      next.mockClear();
      req.authUser = {
        id: 1,
        email: `user@example.com`,
        username: `user`,
        role,
      };

      const middleware = requireRole("ADMIN", "CAPTAIN", "MEMBER");
      middleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith();
    });
  });
});

describe("requireAccess middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = {};
    next = jest.fn();
  });

  it("reuses the configured role set for a named access group", () => {
    req.authUser = {
      id: 1,
      email: "admin@example.com",
      username: "admin",
      role: "ADMIN",
    };

    const middleware = requireAccess("manageContent");
    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("rejects a role that is not part of the access group", () => {
    req.authUser = {
      id: 1,
      email: "member@example.com",
      username: "member",
      role: "MEMBER",
    };

    const middleware = requireAccess("manageTournamentOperations");
    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: "Insufficient permissions",
      })
    );
  });
});

describe("errorHandler middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response> & { status: jest.Mock; json: jest.Mock };
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("handles HttpError with correct status code", () => {
    const error = new HttpError(400, "Bad request");
    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "error",
        message: "Bad request",
      })
    );
  });

  it("returns 500 for generic errors", () => {
    const error = new Error("Something went wrong");
    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("includes timestamp in error response", () => {
    const error = new HttpError(404, "Not found");
    errorHandler(error, req as Request, res as Response, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: expect.any(String),
      })
    );
  });

  it("hides error details in production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const error = new Error("Database connection failed");
    errorHandler(error, req as Request, res as Response, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Internal server error",
      })
    );

    process.env.NODE_ENV = originalEnv;
  });

  it("shows error details in non-production for HttpError", () => {
    const error = new HttpError(400, "Validation failed");
    errorHandler(error, req as Request, res as Response, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Validation failed",
      })
    );
  });
});

describe("notFoundHandler middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response> & { status: jest.Mock; json: jest.Mock };

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("returns 404 status", () => {
    notFoundHandler(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns error status in response", () => {
    notFoundHandler(req as Request, res as Response);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "error",
        message: "Not found",
      })
    );
  });

  it("includes timestamp in response", () => {
    notFoundHandler(req as Request, res as Response);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: expect.any(String),
      })
    );
  });
});

describe("requestLogger middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = { method: "GET", path: "/api/users", query: {}, params: {} };
    res = {};
    next = jest.fn();
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("calls next", () => {
    requestLogger(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("logs request method and path", () => {
    requestLogger(req as Request, res as Response, next);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("GET /api/users"),
      expect.any(Object)
    );
  });

  it("omits sensitive query parameters from debug output", () => {
    req = {
      method: "GET",
      path: "/api/invite",
      query: {
        token: "secret-token",
        email: "member@example.com",
        password: "hunter2",
        page: "1",
      },
      params: { id: "42" },
    };

    requestLogger(req as Request, res as Response, next);

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("GET /api/invite"),
      expect.objectContaining({
        query: { page: "1" },
        params: { id: "42" },
      })
    );
  });
});
