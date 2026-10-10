jest.mock("../repositories/tournamentRepository", () => ({
  findTournamentById: jest.fn(),
  findTeamsByTournament: jest.fn(),
  findPoulesByTournament: jest.fn(),
  findMatchesByTournament: jest.fn(),
}));
jest.mock("../utils/mailer", () => ({
  sendMailBatch: jest.fn(async (inputs: { to: string }[]) => ({
    sent: inputs.filter((i) => !i.to.startsWith("kapot")).map((i) => i.to),
    failed: inputs.filter((i) => i.to.startsWith("kapot")).map((i) => ({ to: i.to, error: "550" })),
  })),
}));
jest.mock("../services/teamPortal.service", () => ({
  portalLinkFor: (token: string) => `https://deflosj.be/mijn-team/${token}`,
}));

import * as repo from "../repositories/tournamentRepository";
import { sendMailBatch } from "../utils/mailer";
import { fillFields, mailTeams } from "../services/teamMail.service";

const r = repo as jest.Mocked<typeof repo>;
const team = (id: number, o: Record<string, unknown> = {}) => ({
  id, name: `Ploeg ${id}`, captainName: `Kapitein ${id}`, email: `p${id}@x.be`, token: `tok${id}`,
  pouleId: 1, isPaid: true, isPresent: false, ...o,
});

beforeEach(() => {
  jest.clearAllMocks();
  r.findTournamentById.mockResolvedValue({ id: 1 } as never);
  r.findPoulesByTournament.mockResolvedValue([{ id: 1, name: "Poule A" }] as never);
  r.findTeamsByTournament.mockResolvedValue([
    team(1),
    team(2, { isPaid: false }),
    team(3, { email: null }),
    team(4, { email: "kapot@x.be" }),
  ] as never);
  r.findMatchesByTournament.mockResolvedValue([
    { teamAId: 1, teamBId: 2, track: 3, scheduledAt: new Date("2026-10-30T15:00:00Z") },
  ] as never);
});

describe("teamMail", () => {
  it("fills known fields and leaves unknown ones alone", () => {
    expect(fillFields("Dag {kapitein}, {onbekend}", { kapitein: "Noa" })).toBe("Dag Noa, {onbekend}");
  });

  it("previews without sending, with per-team fields", async () => {
    const res = await mailTeams(1, { subject: "Hallo {ploeg}", body: "{poule} · {eerste_match} · {portaallink}" });
    expect(sendMailBatch).not.toHaveBeenCalled();
    expect(res.recipients.map((x) => x.teamId)).toEqual([1, 2, 4]);
    expect(res.skipped).toEqual([{ teamId: 3, name: "Ploeg 3" }]);
    expect(res.preview?.subject).toBe("Hallo Ploeg 1");
    expect(res.preview?.text).toContain("Poule A");
    expect(res.preview?.text).toContain("16:00 op baan 3 tegen Ploeg 2");
    expect(res.preview?.text).toContain("https://deflosj.be/mijn-team/tok1");
  });

  it("filters on unpaid", async () => {
    const res = await mailTeams(1, { subject: "x", body: "y", audience: "unpaid" });
    expect(res.recipients.map((x) => x.teamId)).toEqual([2]);
  });

  it("sends and reports failures per team", async () => {
    const res = await mailTeams(1, { subject: "x", body: "y", send: true });
    expect(res.sent).toBe(2);
    expect(res.failed).toEqual([{ name: "Ploeg 4", email: "kapot@x.be", error: "550" }]);
  });

  it("refuses to send without subject", async () => {
    await expect(mailTeams(1, { subject: "", body: "y", send: true })).rejects.toThrow("onderwerp");
  });
});
