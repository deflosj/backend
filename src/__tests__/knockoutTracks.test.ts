import { knockoutTracks } from "../services/tournamentScheduling";

/** Opstelling: 1 2 3 vooraan, 4 5 6 in het verlengde. Baan 2 en 5 = midden. */
describe("knockoutTracks (6 banen)", () => {
  it("finale op baan 2", () => expect(knockoutTracks(1, 6)).toEqual([2]));
  it("finale + kleine finale / halve finales op 2 en 5", () => expect(knockoutTracks(2, 6)).toEqual([2, 5]));
  it("kwartfinales verspreid op 1, 3, 4, 6", () => expect(knockoutTracks(4, 6)).toEqual([1, 3, 4, 6]));
  it("volle ronde: alle banen", () => expect(knockoutTracks(6, 6)).toEqual([1, 2, 3, 4, 5, 6]));
  it("8 matchen: eerst 6 banen, dan 2 op 2 en 5", () =>
    expect(knockoutTracks(8, 6)).toEqual([1, 2, 3, 4, 5, 6, 2, 5]));
});

describe("knockoutTracks (ander aantal banen)", () => {
  it("gewoon van 1 af", () => expect(knockoutTracks(3, 4)).toEqual([1, 2, 3]));
});
