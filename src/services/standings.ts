/**
 * Rangschikking volgens het reglement (art. 8, 9, 6 en 20).
 *
 * In de poule, bij gelijke punten:
 *  1. onderling resultaat — enkel als precies twee teams gelijk staan;
 *  2. puntenverschil (saldo);
 *  3. meeste gescoorde punten;
 *  4. minste punten tegen;
 *  5. bal gooien — door de scheidsrechter beslist en ingegeven
 *     (`pouleTiebreak`, lager = beter). Tot dan: alfabetisch, en de teams
 *     krijgen `tieWith` mee zodat het beheer weet dat er gegooid moet worden.
 * Tussen poules (bv. de acht beste derdes): punten, dan 2 t.e.m. 5
 * (met `rankingTiebreak` voor het bal gooien).
 *
 * Een team met twee forfaits ligt uit het toernooi (art. 6): het zakt naar
 * de laatste plaats van zijn poule en kan niet doorstoten.
 *
 * Puur: geen database, zodat backend en tests exact hetzelfde rekenen.
 */

export const MAX_FORFEITS = 2;

export interface RankStats {
  points: number;
  saldo: number;
  goalsFor: number;
  goalsAgainst: number;
  forfeits: number;
}

export interface RankableTeam extends RankStats {
  id: number;
  name: string;
  pouleTiebreak?: number | null;
  rankingTiebreak?: number | null;
}

export interface RankMatch {
  teamAId: number | null;
  teamBId: number | null;
  scoreA: number | null;
  scoreB: number | null;
}

export interface PouleRankInfo {
  /** 1 = eerste van de poule. */
  pouleRank: number;
  /** Teams waarmee dit team na criteria 1–4 nog volledig gelijk staat. */
  tieWith: number[];
  /** Het bal gooien is ingegeven voor die gelijke stand. */
  tieResolved: boolean;
  /** Twee forfaits: uit het toernooi. */
  eliminated: boolean;
}

export const isEliminated = (t: Pick<RankStats, "forfeits">) => t.forfeits >= MAX_FORFEITS;

/** Criteria 2–4. Negatief = a staat hoger. */
export const compareStats = (a: RankStats, b: RankStats) =>
  b.saldo - a.saldo || b.goalsFor - a.goalsFor || a.goalsAgainst - b.goalsAgainst;

const byTiebreak = (value: number | null | undefined) => value ?? Number.POSITIVE_INFINITY;

/** Onderling resultaat tussen a en b. Negatief = a won, 0 = gelijk/niet gespeeld. */
export const headToHead = (aId: number, bId: number, matches: RankMatch[]): number => {
  let a = 0;
  let b = 0;
  for (const m of matches) {
    if (m.scoreA === null || m.scoreB === null) continue;
    if (m.teamAId === aId && m.teamBId === bId) { a += m.scoreA; b += m.scoreB; }
    else if (m.teamAId === bId && m.teamBId === aId) { a += m.scoreB; b += m.scoreA; }
    else continue;
  }
  return Math.sign(b - a);
};

/** Ordent een groep die op punten gelijk staat. */
const orderTied = <T extends RankableTeam>(group: T[], matches: RankMatch[], out: (T & PouleRankInfo)[]) => {
  if (group.length === 2) {
    const h = headToHead(group[0].id, group[1].id, matches);
    if (h !== 0) {
      const [first, second] = h < 0 ? group : [group[1], group[0]];
      out.push(withInfo(first), withInfo(second));
      return;
    }
  }
  const sorted = [...group].sort(compareStats);
  // Subgroepen die ook op 2–4 gelijk staan: bal gooien.
  let i = 0;
  while (i < sorted.length) {
    let j = i + 1;
    while (j < sorted.length && compareStats(sorted[i], sorted[j]) === 0) j++;
    const tied = sorted.slice(i, j);
    if (tied.length === 1) out.push(withInfo(tied[0]));
    else {
      const ids = tied.map((t) => t.id);
      const ranks = tied.map((t) => t.pouleTiebreak);
      const resolved = ranks.every((r) => r !== null && r !== undefined) && new Set(ranks).size === ranks.length;
      tied
        .sort((a, b) => byTiebreak(a.pouleTiebreak) - byTiebreak(b.pouleTiebreak) || a.name.localeCompare(b.name))
        .forEach((t) => out.push({ ...t, pouleRank: 0, tieWith: ids.filter((id) => id !== t.id), tieResolved: resolved, eliminated: false }));
    }
    i = j;
  }
};

const withInfo = <T extends RankableTeam>(t: T): T & PouleRankInfo => ({
  ...t, pouleRank: 0, tieWith: [], tieResolved: false, eliminated: false,
});

/** Volledige stand van één poule. `matches` = de poulewedstrijden. */
export const rankPoule = <T extends RankableTeam>(teams: T[], matches: RankMatch[]): (T & PouleRankInfo)[] => {
  const active = teams.filter((t) => !isEliminated(t));
  const out: (T & PouleRankInfo)[] = [];

  const byPoints = [...active].sort((a, b) => b.points - a.points);
  let i = 0;
  while (i < byPoints.length) {
    let j = i + 1;
    while (j < byPoints.length && byPoints[j].points === byPoints[i].points) j++;
    const group = byPoints.slice(i, j);
    if (group.length === 1) out.push(withInfo(group[0]));
    else orderTied(group, matches, out);
    i = j;
  }

  // Uitgeschakeld: onderaan, zonder bal gooien.
  teams
    .filter(isEliminated)
    .sort((a, b) => b.points - a.points || compareStats(a, b) || a.name.localeCompare(b.name))
    .forEach((t) => out.push({ ...withInfo(t), eliminated: true }));

  return out.map((t, idx) => ({ ...t, pouleRank: idx + 1 }));
};

/** Vergelijking over poules heen (beste derdes, seeding). Negatief = a hoger. */
export const compareAcrossPoules = (
  a: RankStats & { name: string; rankingTiebreak?: number | null },
  b: RankStats & { name: string; rankingTiebreak?: number | null }
) =>
  b.points - a.points ||
  compareStats(a, b) ||
  byTiebreak(a.rankingTiebreak) - byTiebreak(b.rankingTiebreak) ||
  a.name.localeCompare(b.name);
