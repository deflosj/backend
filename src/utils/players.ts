/** Ingevuld, maar geen echte speler: "K1"–"K4", "S1"–"S4", "Speler 2", "?", "-", "nvt"…
 *  Zelfde regel als frontend/lib/team-roster.ts. */
const PLACEHOLDER = /^(?:[ks]|speler|kapitein)\s*[-._#]?\s*\d{1,2}$|^[-–—?./x]*$|^(?:nvt|n\.v\.t\.?|tbd|tba|onbekend|nog niet gekend|later)$/i;

export const isPlaceholderPlayer = (name: string | null | undefined): boolean => PLACEHOLDER.test((name ?? "").trim());

type Players = { speler1: string | null; speler2: string | null; speler3: string | null; speler4: string | null };

/** Aantal echte spelers (0–4) in de vier spelersvakken. */
export const playerCount = (t: Players): number =>
  [t.speler1, t.speler2, t.speler3, t.speler4].filter((s) => !isPlaceholderPlayer(s)).length;

export const isTeamComplete = (t: Players): boolean => playerCount(t) === 4;
