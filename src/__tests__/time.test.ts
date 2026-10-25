import { atBrusselsTime, fmtDateTime, fromBrussels, parseDateInput } from "../utils/time";

describe("tijd in Belgische tijdzone (onafhankelijk van server-TZ)", () => {
  it("rekent Belgische kloktijd om naar UTC, zomer én winter", () => {
    expect(fromBrussels(2026, 10, 24, 14, 0).toISOString()).toBe("2026-10-24T12:00:00.000Z");
    expect(fromBrussels(2026, 10, 25, 14, 0).toISOString()).toBe("2026-10-25T13:00:00.000Z");
    expect(fromBrussels(2027, 3, 28, 4, 0).toISOString()).toBe("2027-03-28T02:00:00.000Z");
  });

  it("leest een string zonder tijdzone als Belgische tijd", () => {
    expect(parseDateInput("2026-05-01T14:00")?.toISOString()).toBe("2026-05-01T12:00:00.000Z");
    expect(parseDateInput("2026-05-01T14:00:00.000Z")?.toISOString()).toBe("2026-05-01T14:00:00.000Z");
    expect(parseDateInput("geen datum")).toBeNull();
  });

  it("plakt '15:00' op de Belgische kalenderdag van de wedstrijd", () => {
    // 22:30 UTC op 1 mei = 00:30 op 2 mei in België
    expect(atBrusselsTime(new Date("2026-05-01T22:30:00Z"), 15, 0).toISOString()).toBe("2026-05-02T13:00:00.000Z");
  });

  it("toont uren in Belgische tijd", () => {
    expect(fmtDateTime(new Date("2026-05-01T12:00:00Z"), { hour: "2-digit", minute: "2-digit" })).toBe("14:00");
  });
});
