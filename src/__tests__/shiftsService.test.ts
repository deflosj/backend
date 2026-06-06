import { getInviteWithGroups, validateInviteToken } from "../services/shifts.service";
import { findInviteToken } from "../repositories/helpersRepository";
import { listGroupsByEvent } from "../repositories/shiftRepository";

jest.mock("../repositories/helpersRepository");
jest.mock("../repositories/shiftRepository");

const helpersRepositoryMock = {
  findInviteToken: findInviteToken as jest.Mock,
};

const shiftRepositoryMock = {
  listGroupsByEvent: listGroupsByEvent as jest.Mock,
};

describe("shiftsService invite tokens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects expired invite tokens during validation", async () => {
    helpersRepositoryMock.findInviteToken.mockResolvedValue({
      token: "expired",
      eventId: 1,
      expiresAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    await expect(validateInviteToken("expired")).rejects.toMatchObject({
      statusCode: 401,
      message: "Ongeldige uitnodigingslink",
    });
  });

  it("rejects expired invite tokens when loading groups", async () => {
    helpersRepositoryMock.findInviteToken.mockResolvedValue({
      token: "expired",
      eventId: 1,
      event: { id: 1 },
      expiresAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    await expect(getInviteWithGroups("expired")).rejects.toMatchObject({
      statusCode: 404,
      message: "Ongeldige of verlopen uitnodigingslink",
    });

    expect(shiftRepositoryMock.listGroupsByEvent).not.toHaveBeenCalled();
  });
});