import { compareAcrossPoules, headToHead, rankPoule, RankableTeam, RankMatch } from "../services/standings";
import { rankQualifiers } from "../services/tournamentScheduling";
import { parseAttachments } from "../services/teamMail.service";

const team = (id: number, s: Partial<RankableTeam> = {}): RankableTeam => ({
  id, name: `T${id}`, points: 0, saldo: 0, goalsFor: 0, goalsAgainst: 0, forfeits: 0, ...s,
});
const m = (a: number, b: number, sa: number, sb: number): RankMatch => ({ teamAId: a, teamBId: b, scoreA: sa, scoreB: sb });

describe("rankPoule — reglement art. 9", () => {
  it("punten eerst", () => {
    const r = rankPoule([team(1, { points: 2 }), team(2, { points: 4 })], []);
    expect(r.map((t) => t.id)).toEqual([2, 1]);
    expect(r[0].pouleRank).toBe(1);
  });

  it("twee teams gelijk op punten: onderling resultaat vóór saldo", () => {
    // Team 1 heeft het betere saldo, maar verloor van team 2.
    const teams = [team(1, { points: 4, saldo: 10, goalsFor: 20 }), team(2, { points: 4, saldo: 1, goalsFor: 8 })];
    const r = rankPoule(teams, [m(1, 2, 3, 5)]);
    expect(r.map((t) => t.id)).toEqual([2, 1]);
    expect(r[0].tieWith).toEqual([]);
  });

  it("onderling gelijk gespeeld: dan saldo", () => {
    const teams = [team(1, { points: 4, saldo: 1 }), team(2, { points: 4, saldo: 3 })];
    expect(rankPoule(teams, [m(1, 2, 4, 4)]).map((t) => t.id)).toEqual([2, 1]);
  });

  it("drie teams gelijk op punten: geen onderling resultaat, wel saldo", () => {
    const teams = [
      team(1, { points: 2, saldo: 0 }),
      team(2, { points: 2, saldo: 5 }),
      team(3, { points: 2, saldo: -1 }),
    ];
    // 3 won van 2, maar bij drie teams telt dat niet.
    expect(rankPoule(teams, [m(3, 2, 6, 1)]).map((t) => t.id)).toEqual([2, 1, 3]);
  });

  it("saldo gelijk: meeste gescoord, dan minste tegen", () => {
    const teams = [
      team(1, { points: 2, saldo: 2, goalsFor: 8, goalsAgainst: 6 }),
      team(2, { points: 2, saldo: 2, goalsFor: 10, goalsAgainst: 8 }),
      team(3, { points: 2, saldo: 2, goalsFor: 10, goalsAgainst: 8 }),
    ];
    const r = rankPoule(teams, []);
    expect(r.map((t) => t.id)).toEqual([2, 3, 1]);
    // 2 en 3 staan volledig gelijk: bal gooien nodig.
    expect(r[0].tieWith).toEqual([3]);
    expect(r[0].tieResolved).toBe(false);
    expect(r[2].tieWith).toEqual([]);
  });

  it("bal gooien beslist de volledige gelijke stand", () => {
    const teams = [
      team(1, { points: 2, saldo: 2, goalsFor: 10, pouleTiebreak: 2 }),
      team(2, { points: 2, saldo: 2, goalsFor: 10, pouleTiebreak: 1 }),
    ];
    const r = rankPoule(teams, [m(1, 2, 5, 5)]);
    expect(r.map((t) => t.id)).toEqual([2, 1]);
    expect(r[0].tieResolved).toBe(true);
  });

  it("twee forfaits: onderaan en uitgeschakeld", () => {
    const teams = [team(1, { points: 4, forfeits: 2 }), team(2, { points: 0 }), team(3, { points: 2 })];
    const r = rankPoule(teams, []);
    expect(r.map((t) => t.id)).toEqual([3, 2, 1]);
    expect(r[2].eliminated).toBe(true);
  });
});

describe("headToHead", () => {
  it("negatief als a won", () => {
    expect(headToHead(1, 2, [m(2, 1, 1, 7)])).toBe(-1);
    expect(headToHead(1, 2, [m(1, 2, 1, 7)])).toBe(1);
    expect(headToHead(1, 2, [])).toBe(0);
  });
});

describe("beste derdes", () => {
  const base = { saldo: 0, goalsFor: 0, forfeits: 0 };
  it("minste punten tegen telt mee, dan bal gooien", () => {
    const a = { ...base, name: "A", points: 2, goalsAgainst: 5 };
    const b = { ...base, name: "B", points: 2, goalsAgainst: 3 };
    expect(compareAcrossPoules(a, b)).toBeGreaterThan(0);
    const c = { ...a, name: "C", rankingTiebreak: 1 };
    const d = { ...a, name: "A2", rankingTiebreak: 2 };
    expect(compareAcrossPoules(c, d)).toBeLessThan(0);
  });

  it("uitgeschakelde teams stoten niet door; de volgende schuift op", () => {
    const row = (teamId: number, pouleId: number, points: number, eliminated = false) => ({
      teamId, pouleId, points, saldo: 0, goalsFor: 0, name: `T${teamId}`, eliminated,
    });
    const seeds = rankQualifiers(
      [
        [row(1, 1, 6), row(2, 1, 4, true), row(3, 1, 2)],
        [row(4, 2, 6), row(5, 2, 4), row(6, 2, 1)],
      ],
      2,
      0
    );
    expect(seeds.map((s) => s.teamId)).toEqual([1, 4, 5, 3]);
  });
});

describe("parseAttachments", () => {
  const pdf = Buffer.from("%PDF-1.4 test").toString("base64");
  it("aanvaardt een PDF en haalt een data:-prefix weg", () => {
    const [a] = parseAttachments([{ filename: "Reglement 2026.pdf", content: `data:application/pdf;base64,${pdf}` }]);
    expect(a).toEqual({ filename: "Reglement 2026.pdf", content: pdf, contentType: "application/pdf" });
  });
  it("leeg = geen bijlagen", () => {
    expect(parseAttachments(undefined)).toEqual([]);
  });
  it("weigert andere types en te veel bijlagen", () => {
    expect(() => parseAttachments([{ filename: "virus.exe", content: pdf }])).toThrow();
    expect(() => parseAttachments(Array(4).fill({ filename: "a.pdf", content: pdf }))).toThrow();
  });
  it("weigert te grote bijlagen", () => {
    const big = "A".repeat(7 * 1024 * 1024);
    expect(() => parseAttachments([{ filename: "a.pdf", content: big }])).toThrow(/5 MB/);
  });
});
