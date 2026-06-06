import { generateInviteLink, getInviteWithTasks, removeTaskAssignee, validateInviteToken } from "../services/helpers.service";
import {
  createInviteToken,
  findTaskAssigneeById,
  findInviteToken,
  listTasksByEvent,
  removeTaskAssigneeById,
} from "../repositories/helpersRepository";

jest.mock("../repositories/helpersRepository");

const helpersRepositoryMock = {
  createInviteToken: createInviteToken as jest.Mock,
  findTaskAssigneeById: findTaskAssigneeById as jest.Mock,
  findInviteToken: findInviteToken as jest.Mock,
  listTasksByEvent: listTasksByEvent as jest.Mock,
  removeTaskAssigneeById: removeTaskAssigneeById as jest.Mock,
};

describe("helpersService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("removeTaskAssignee", () => {
    it("removes an assignee only when it belongs to the given task and event", async () => {
      const tasks = [{ id: 1 }];

      helpersRepositoryMock.findTaskAssigneeById.mockResolvedValue({
        id: 12,
        taskId: 7,
        task: { id: 7, eventId: 3 },
      });
      helpersRepositoryMock.listTasksByEvent.mockResolvedValue(tasks);

      const result = await removeTaskAssignee(12, 7, 3);

      expect(helpersRepositoryMock.removeTaskAssigneeById).toHaveBeenCalledWith(12);
      expect(helpersRepositoryMock.listTasksByEvent).toHaveBeenCalledWith(3);
      expect(result).toEqual(tasks);
    });

    it("throws 404 when the assignee belongs to another event", async () => {
      helpersRepositoryMock.findTaskAssigneeById.mockResolvedValue({
        id: 12,
        taskId: 7,
        task: { id: 7, eventId: 99 },
      });

      await expect(removeTaskAssignee(12, 7, 3)).rejects.toMatchObject({
        statusCode: 404,
        message: "Taakassignee niet gevonden",
      });

      expect(helpersRepositoryMock.removeTaskAssigneeById).not.toHaveBeenCalled();
      expect(helpersRepositoryMock.listTasksByEvent).not.toHaveBeenCalled();
    });
  });

  describe("invite tokens", () => {
    it("stores an expiry when generating an invite link", async () => {
      const now = new Date("2026-01-01T00:00:00.000Z");
      jest.useFakeTimers().setSystemTime(now);
      helpersRepositoryMock.createInviteToken.mockResolvedValue({});

      await generateInviteLink(42, 7);

      expect(helpersRepositoryMock.createInviteToken).toHaveBeenCalledWith(
        42,
        expect.any(String),
        7,
        new Date("2026-01-08T00:00:00.000Z")
      );

      jest.useRealTimers();
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

    it("rejects expired invite tokens when loading tasks", async () => {
      helpersRepositoryMock.findInviteToken.mockResolvedValue({
        token: "expired",
        eventId: 1,
        event: { id: 1 },
        expiresAt: new Date("2026-01-01T00:00:00.000Z"),
      });

      await expect(getInviteWithTasks("expired")).rejects.toMatchObject({
        statusCode: 404,
        message: "Ongeldige of verlopen uitnodigingslink",
      });

      expect(helpersRepositoryMock.listTasksByEvent).not.toHaveBeenCalled();
    });
  });
});