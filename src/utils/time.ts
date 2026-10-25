/**
 * Tijdzone-veilige helpers. De server draait in UTC, maar alle tijden die
 * mensen typen of lezen ("15:00", "zaterdag 14u") zijn Belgische tijd.
 * Gebruik nooit setHours()/getHours()/toLocaleString() zonder deze helpers.
 */

export const EVENT_TZ = "Europe/Brussels";

const partsFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: EVENT_TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function brusselsParts(d: Date) {
  const get = (type: string) => Number(partsFmt.formatToParts(d).find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

function offsetMs(d: Date): number {
  const p = brusselsParts(d);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(d.getTime() / 1000) * 1000;
}

/** Belgische kloktijd → echt tijdstip (zomer/wintertijd inbegrepen). */
export function fromBrussels(year: number, month: number, day: number, hour = 0, minute = 0, second = 0): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute, second);
  let t = guess - offsetMs(new Date(guess));
  t = guess - offsetMs(new Date(t));
  return new Date(t);
}

/** Zet een Belgisch uur (hh:mm) op dezelfde Belgische kalenderdag als `day`. */
export function atBrusselsTime(day: Date, hour: number, minute: number): Date {
  const p = brusselsParts(day);
  return fromBrussels(p.year, p.month, p.day, hour, minute);
}

/**
 * Parse een datum uit een request. Strings mét tijdzone ("…Z", "…+02:00")
 * worden letterlijk genomen; strings zonder ("2026-05-01T14:00") worden als
 * Belgische tijd gelezen in plaats van als servertijd (UTC).
 * Geeft null terug bij een ongeldige waarde.
 */
export function parseDateInput(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const naive = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/.exec(raw);
  if (naive) {
    const [, y, mo, d, h, mi, s] = naive;
    return fromBrussels(+y, +mo, +d, +h, +mi, s ? +s : 0);
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function fmtDateTime(d: Date, opts?: Intl.DateTimeFormatOptions): string {
  return d.toLocaleString("nl-BE", { ...opts, timeZone: EVENT_TZ });
}
