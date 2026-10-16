import config from "../config";
import { getMailStatus } from "../utils/mailer";

const cfg = config as unknown as {
  mailProvider: string;
  mailFrom: string;
  resend: { apiKey: string };
};

describe("getMailStatus", () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    cfg.mailProvider = "resend";
    cfg.mailFrom = "De Flosj <info@deflosj.be>";
    cfg.resend.apiKey = "re_test";
  });

  it("geeft het Resend-verbruik terug", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        emails: {
          daily: { used: 12, limit: 100, resets_at: "2026-10-16T00:00:00.000Z" },
          monthly: { used: 340, limit: 3000, resets_at: "2026-11-01T00:00:00.000Z" },
        },
      }),
    });
    const s = await getMailStatus();
    expect(s.provider).toBe("resend");
    expect(s.usage?.daily).toEqual({ used: 12, limit: 100, resetsAt: "2026-10-16T00:00:00.000Z" });
    expect(s.usage?.monthly?.limit).toBe(3000);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.resend.com/usage");
  });

  it("meldt een duidelijke fout als de key geen rechten heeft", async () => {
    jest.resetModules();
    const { getMailStatus: fresh } = await import("../utils/mailer");
    const freshCfg = (await import("../config")).default as unknown as typeof cfg;
    freshCfg.mailProvider = "resend";
    freshCfg.mailFrom = "x@deflosj.be";
    freshCfg.resend.apiKey = "re_test";
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, statusText: "Unauthorized", json: async () => ({}) });
    const s = await fresh();
    expect(s.usage).toBeNull();
    expect(s.usageError).toMatch(/Full access/);
  });
});
