/**
 * Draait vóór elke testsuite (zie jest.config.json → setupFiles).
 * dotenv overschrijft geen bestaande variabelen, dus wat hier staat wint
 * van .env: tests mogen nooit tegen een echte database lopen.
 */
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@127.0.0.1:1/deflosj_test_no_db";

/**
 * Geen enkele test praat met Prisma: elke query faalt luid. Suites die de
 * client zelf mocken (jest.mock("../database/prisma", …)) overschrijven dit.
 */
jest.mock("../../database/prisma", () => {
  const fail = (model: string, action: string) => () =>
    Promise.reject(new Error(`Test raakte de database (prisma.${model}.${action}). Mock de repository of service.`));
  const client = new Proxy({}, {
    get: (_t, model) => new Proxy(() => undefined, {
      get: (_m, action) => fail(String(model), String(action)),
      apply: () => fail(String(model), "call")(),
    }),
  });
  return { __esModule: true, default: client };
});
