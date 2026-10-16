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
  pouleId: 1, isPaid: true, isPresent: false,
  speler1: "An", speler2: "Bo", speler3: "Cas", speler4: "Dina", ...o,
});

beforeEach(() => {
  jest.clearAllMocks();
  r.findTournamentById.mockResolvedValue({ id: 1 } as never);
  r.findPoulesByTournament.mockResolvedValue([{ id: 1, name: "Poule A" }] as never);
  r.findTeamsByTournament.mockResolvedValue([
    team(1),
    team(2, { speler3: "S3", speler4: "" }),
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

  it("filters on incomplete teams, counting placeholders like K1/S3 as empty", async () => {
    const res = await mailTeams(1, { subject: "x", body: "Nog {ontbrekend}", audience: "incomplete" });
    expect(res.recipients.map((x) => x.teamId)).toEqual([2]);
    expect(res.preview?.text).toBe("Nog 2 spelers");
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

describe("players", () => {
  const { isPlaceholderPlayer } = jest.requireActual("../utils/players") as typeof import("../utils/players");
  it.each(["", "  ", "K1", "k4", "S2", "s 3", "Speler 1", "speler-2", "?", "-", "nvt", "TBD"])("%p is a placeholder", (n) => {
    expect(isPlaceholderPlayer(n)).toBe(true);
  });
  it.each(["Kobe", "Sam", "K. Jacobs", "Senne 2", "Xavier"])("%p is a real player", (n) => {
    expect(isPlaceholderPlayer(n)).toBe(false);
  });

  it("stuurt een testmail enkel naar het testadres, niet naar de ploegen", async () => {
    const res = await mailTeams(1, { subject: "Hallo {ploeg}", body: "Dag {kapitein}", send: true, testTo: "wannes@x.be" });
    expect(sendMailBatch).toHaveBeenCalledTimes(1);
    const sent = (sendMailBatch as jest.Mock).mock.calls[0][0] as { to: string; subject: string; text: string }[];
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: "wannes@x.be", subject: "[TEST] Hallo Ploeg 1", text: "Dag Kapitein 1" });
    expect(res.sent).toBe(1);
  });

  it("weigert een ongeldig testadres", async () => {
    await expect(mailTeams(1, { subject: "x", body: "y", send: true, testTo: "geen-mail" })).rejects.toMatchObject({ statusCode: 400 });
    expect(sendMailBatch).not.toHaveBeenCalled();
  });
});
