import prisma from "../database/prisma";
import { exportAttendanceCsv } from "../repositories/helpersRepository";

jest.mock("../database/prisma", () => ({
  __esModule: true,
  default: {
    attendance: {
      findMany: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as any;

describe("helpersRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("exportAttendanceCsv", () => {
    it("quotes cells and prefixes dangerous values", async () => {
      mockPrisma.attendance.findMany.mockResolvedValue([
        { name: '=cmd|" /C calc"!A0', email: "user@example.com", status: "NO_RESPONSE" },
        { name: "Alice, The \"Great\"", email: "+evil@example.com", status: "YES" },
        { name: "-LeadingDash", email: "@evil.example", status: "NO" },
      ]);

      const csv = await exportAttendanceCsv(123);

      expect(csv).toBe(
        [
          '"name","email","status"',
          '"\'=cmd|"" /C calc""!A0","user@example.com","NO_RESPONSE"',
          '"Alice, The ""Great""","\'+evil@example.com","YES"',
          '"\'-LeadingDash","\'@evil.example","NO"',
        ].join("\n")
      );
      expect(mockPrisma.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { eventId: 123 } })
      );
    });
  });
});