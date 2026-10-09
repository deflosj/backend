/**
 * Pure planningslogica voor het toernooi: geen database, enkel rekenwerk.
 * Zo is alles los te testen en blijft tournament.service.ts leesbaar.
 *
 *  - Poulefase:  elke baan krijgt vaste poules; poules op dezelfde baan
 *                spelen om beurten (zoals in 2025: baan 1 = poule A & B).
 *  - Knock-out:  ranking 1..N over alle poules heen, klassieke bracket
 *                (1 vs 32, 2 vs 31 …), nooit twee teams uit dezelfde poule
 *                in de eerste ronde.
 */
import { Phase } from "@prisma/client";

// ── Gedeelde types ────────────────────────────────────────────────────────────

export interface PlannedMatch {
  pouleId: number | null;
  teamAId: number | null;
  teamBId: number | null;
  scheduledAt: Date;
  track: number;
  phase: Phase;
  bracketPos: string | null;
}

const addMinutes = (d: Date, minutes: number) => new Date(d.getTime() + minutes * 60_000);

// ── Round robin ───────────────────────────────────────────────────────────────

/** Speelrondes voor één poule (cirkelmethode). Bij een oneven aantal heeft
 *  elke ronde één team vrij. */
export function roundRobinRounds<T>(teams: T[]): Array<Array<[T, T]>> {
  const n = teams.length;
  if (n < 2) return [];

  if (n === 4) {
    // Vaste volgorde zoals op het papieren schema van 2025.
    return [
      [[teams[0], teams[3]], [teams[1], teams[2]]],
      [[teams[0], teams[2]], [teams[1], teams[3]]],
      [[teams[0], teams[1]], [teams[3], teams[2]]],
    ];
  }

  const circle: (T | null)[] = [...teams];
  if (n % 2 !== 0) circle.push(null);
  const size = circle.length;
  const fixed = circle[0];
  let rotating = circle.slice(1);
  const rounds: Array<Array<[T, T]>> = [];

  for (let r = 0; r < size - 1; r++) {
    const round: Array<[T, T]> = [];
    const b = rotating[0];
    if (fixed !== null && b !== null) round.push([fixed, b]);
    for (let i = 1; i < size / 2; i++) {
      const x = rotating[i];
      const y = rotating[size - 1 - i];
      if (x !== null && y !== null) round.push([x, y]);
    }
    rounds.push(round);
    rotating = [...rotating.slice(-1), ...rotating.slice(0, -1)];
  }
  return rounds;
}

// ── Poulefase ─────────────────────────────────────────────────────────────────

export interface PouleInput {
  id: number;
  teamIds: number[];
}

export interface GroupScheduleParams {
  startTime: Date;
  slotMinutes: number;
  trackCount: number;
}

/** Welke banen elke poule krijgt.
 *  - Meer banen dan poules: een poule krijgt er meerdere en speelt de
 *    wedstrijden van één ronde tegelijk.
 *  - Minder banen dan poules: poules delen een baan, zo gelijk mogelijk
 *    verdeeld (12 poules / 6 banen → A+B op baan 1, C+D op baan 2, …). */
export function assignTracks(poules: PouleInput[], trackCount: number): number[][] {
  const p = poules.length;
  if (p === 0) return [];
  if (trackCount >= p) {
    const perPoule = Math.floor(trackCount / p);
    let next = 1;
    return poules.map((poule) => {
      const usable = Math.max(1, Math.min(perPoule, Math.floor(poule.teamIds.length / 2)));
      const tracks = Array.from({ length: usable }, (_, i) => next + i);
      next += perPoule;
      return tracks;
    });
  }
  return poules.map((_, i) => [Math.floor((i * trackCount) / p) + 1]);
}

export function scheduleGroupStage(poules: PouleInput[], params: GroupScheduleParams): PlannedMatch[] {
  const { startTime, slotMinutes, trackCount } = params;
  if (trackCount < 1) throw new Error("trackCount must be at least 1");

  const tracksPerPoule = assignTracks(poules, trackCount);
  const rounds = poules.map((p) => roundRobinRounds(p.teamIds));
  const planned: PlannedMatch[] = [];

  // Groepeer poules per baan(set). Poules met dezelfde banen spelen om beurten.
  const byTrackSet = new Map<string, number[]>();
  tracksPerPoule.forEach((tracks, i) => {
    const key = tracks.join(",");
    byTrackSet.set(key, [...(byTrackSet.get(key) ?? []), i]);
  });

  for (const [key, pouleIdxs] of byTrackSet) {
    const tracks = key.split(",").map(Number);
    // Elke poule wordt een rij "beurten": zoveel wedstrijden uit dezelfde
    // ronde als er banen zijn. Poules op dezelfde baan wisselen per beurt af
    // (A-1, B-1, A-2, B-2, …), net als het schema van 2025.
    const turns = pouleIdxs.map((pi) =>
      rounds[pi].flatMap((round) => {
        const chunks: Array<Array<[number, number]>> = [];
        for (let m = 0; m < round.length; m += tracks.length) chunks.push(round.slice(m, m + tracks.length));
        return chunks;
      })
    );
    const maxTurns = Math.max(...turns.map((t) => t.length));
    let slot = 0;
    for (let t = 0; t < maxTurns; t++) {
      pouleIdxs.forEach((pi, k) => {
        const turn = turns[k][t];
        if (!turn) return;
        turn.forEach(([a, b], i) => {
          planned.push({
            pouleId: poules[pi].id,
            teamAId: a,
            teamBId: b,
            scheduledAt: addMinutes(startTime, slot * slotMinutes),
            track: tracks[i],
            phase: Phase.GROUP_STAGE,
            bracketPos: null,
          });
        });
        slot++;
      });
    }
  }

  return planned.sort(
    (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime() || a.track - b.track
  );
}

// ── Knock-out: seeding ────────────────────────────────────────────────────────

export interface StandingInput {
  teamId: number;
  pouleId: number;
  points: number;
  saldo: number;
  goalsFor: number;
  name: string;
}

const compareStanding = (a: StandingInput, b: StandingInput) =>
  b.points - a.points || b.saldo - a.saldo || b.goalsFor - a.goalsFor || a.name.localeCompare(b.name);

/** Rangschikt de doorgaande teams 1..N: eerst alle poulewinnaars (onderling
 *  op punten, saldo, gemaakte punten), dan alle tweedes, … en tot slot de
 *  beste n-des. `standings` is per poule al gesorteerd. */
export function rankQualifiers(
  standings: StandingInput[][],
  advancingPerPoule: number,
  bestNths: number
): StandingInput[] {
  const seeds: StandingInput[] = [];
  for (let place = 0; place < advancingPerPoule; place++) {
    seeds.push(
      ...standings
        .map((s) => s[place])
        .filter((t): t is StandingInput => !!t)
        .sort(compareStanding)
    );
  }
  if (bestNths > 0) {
    seeds.push(
      ...standings
        .map((s) => s[advancingPerPoule])
        .filter((t): t is StandingInput => !!t)
        .sort(compareStanding)
        .slice(0, bestNths)
    );
  }
  return seeds;
}

/** Klassieke bracketvolgorde: 1 en 2 kunnen pas in de finale treffen.
 *  size 8 → [1,8,4,5,2,7,3,6]. */
export function bracketOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const n = order.length * 2;
    order = order.flatMap((s) => [s, n + 1 - s]);
  }
  return order;
}

export const nextPowerOfTwo = (n: number) => 2 ** Math.ceil(Math.log2(Math.max(2, n)));

/** Eerste-rondekoppels als seednummers (1-based; > N = vrijloting). Teams uit
 *  dezelfde poule worden uit elkaar gehaald door de tegenstander te ruilen met
 *  die van een koppel met zo gelijk mogelijke sterkte. */
export function firstRoundPairs(seeds: StandingInput[]): Array<[number, number]> {
  const size = nextPowerOfTwo(seeds.length);
  const order = bracketOrder(size);
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < size; i += 2) pairs.push([order[i], order[i + 1]]);

  const poule = (seed: number) => (seed <= seeds.length ? seeds[seed - 1].pouleId : null);
  const clash = ([a, b]: [number, number]) => poule(a) !== null && poule(a) === poule(b);

  for (let i = 0; i < pairs.length; i++) {
    if (!clash(pairs[i])) continue;
    // Kandidaten: koppels waarvan de zwakkere seed het dichtst bij ligt.
    const candidates = pairs
      .map((p, j) => ({ j, dist: Math.abs(p[1] - pairs[i][1]) }))
      .filter(({ j }) => j !== i)
      .sort((x, y) => x.dist - y.dist);
    for (const { j } of candidates) {
      const a: [number, number] = [pairs[i][0], pairs[j][1]];
      const b: [number, number] = [pairs[j][0], pairs[i][1]];
      if (!clash(a) && !clash(b)) {
        pairs[i] = a;
        pairs[j] = b;
        break;
      }
    }
  }
  return pairs;
}

// ── Knock-out: bracket ────────────────────────────────────────────────────────

/** Rondes van groot naar klein. Index = log2(aantal wedstrijden). */
const ROUND_META: Record<number, { phase: Phase; pos: (n: number) => string }> = {
  16: { phase: Phase.ROUND_OF_32, pos: (n) => `R32-${n}` },
  8: { phase: Phase.ROUND_OF_16, pos: (n) => `R16-${n}` },
  4: { phase: Phase.QUARTER_FINAL, pos: (n) => `QF${n}` },
  2: { phase: Phase.SEMI_FINAL, pos: (n) => `SF${n}` },
  1: { phase: Phase.FINAL, pos: () => "F1" },
};

export const MAX_KNOCKOUT_TEAMS = 32;

/** Waar winnaar (en bij halve finales de verliezer) naartoe gaat. */
export function nextBracketSlot(
  bracketPos: string
): { winner?: [string, "A" | "B"]; loser?: [string, "A" | "B"] } | null {
  const m = /^(R32-|R16-|QF|SF)(\d+)$/.exec(bracketPos);
  if (!m) return null;
  const n = Number(m[2]);
  const slot: "A" | "B" = n % 2 === 1 ? "A" : "B";
  const half = Math.ceil(n / 2);
  switch (m[1]) {
    case "R32-": return { winner: [`R16-${half}`, slot] };
    case "R16-": return { winner: [`QF${half}`, slot] };
    case "QF":   return { winner: [`SF${half}`, slot] };
    case "SF":   return { winner: ["F1", slot], loser: ["CF1", slot] };
    default:     return null;
  }
}

export interface KnockoutScheduleParams {
  startTime: Date;
  slotMinutes: number;
  /** Extra pauze tussen twee rondes (bv. om scores te verwerken). */
  breakMinutes: number;
  trackCount: number;
  withConsolation: boolean;
}

/** Volledige bracket: eerste ronde ingevuld, latere rondes leeg (TBD).
 *  Vrijlotingen zetten het team meteen in de volgende ronde. Elke ronde
 *  start pas als de vorige volledig gespeeld kan zijn. */
export function buildKnockout(seeds: StandingInput[], params: KnockoutScheduleParams): PlannedMatch[] {
  if (seeds.length < 2) throw new Error("At least 2 teams are needed for a knockout");
  if (seeds.length > MAX_KNOCKOUT_TEAMS) throw new Error(`At most ${MAX_KNOCKOUT_TEAMS} teams supported`);
  const { startTime, slotMinutes, breakMinutes, trackCount } = params;

  const size = nextPowerOfTwo(seeds.length);
  const teamOf = (seed: number) => (seed <= seeds.length ? seeds[seed - 1].teamId : null);
  const pairs = firstRoundPairs(seeds);

  // Alle wedstrijden als lege skeletten, ronde per ronde.
  type Skeleton = { phase: Phase; pos: string; a: number | null; b: number | null; skip: boolean };
  const rounds: Skeleton[][] = [];
  for (let matches = size / 2; matches >= 1; matches /= 2) {
    const meta = ROUND_META[matches];
    rounds.push(
      Array.from({ length: matches }, (_, i) => ({ phase: meta.phase, pos: meta.pos(i + 1), a: null, b: null, skip: false }))
    );
  }

  // Eerste ronde invullen; vrijlotingen doorschuiven.
  pairs.forEach(([sa, sb], i) => {
    const m = rounds[0][i];
    m.a = teamOf(sa);
    m.b = teamOf(sb);
    if (m.a === null || m.b === null) {
      m.skip = true;
      const next = rounds[1]?.[Math.floor(i / 2)];
      if (next) {
        if (i % 2 === 0) next.a = m.a ?? m.b;
        else next.b = m.a ?? m.b;
      }
    }
  });

  if (params.withConsolation && size >= 4) {
    rounds[rounds.length - 1].unshift({ phase: Phase.CONSOLATION_FINAL, pos: "CF1", a: null, b: null, skip: false });
  }

  // Inplannen: per ronde zoveel slots als nodig op `trackCount` banen.
  const planned: PlannedMatch[] = [];
  let roundStart = startTime;
  for (const round of rounds) {
    const playable = round.filter((m) => !m.skip);
    playable.forEach((m, i) => {
      planned.push({
        pouleId: null,
        teamAId: m.a,
        teamBId: m.b,
        scheduledAt: addMinutes(roundStart, Math.floor(i / trackCount) * slotMinutes),
        track: (i % trackCount) + 1,
        phase: m.phase,
        bracketPos: m.pos,
      });
    });
    const slots = Math.max(1, Math.ceil(playable.length / trackCount));
    roundStart = addMinutes(roundStart, slots * slotMinutes + breakMinutes);
  }
  return planned;
}
