import { UserRole } from "@prisma/client";

export type RoleAccessKey = keyof typeof ROLE_MANAGER;

type RoleAccessDefinition = {
  label: string;
  description: string;
  roles: readonly UserRole[];
};

export const ROLE_MANAGER = {
  manageRoles: {
    label: "Role matrix",
    description: "View the centralized permission matrix.",
    roles: [UserRole.ADMIN, UserRole.SUPERADMIN],
  },
  manageContent: {
    label: "Content management",
    description: "Create and edit news, events, and sponsors.",
    roles: [UserRole.ADMIN, UserRole.SUPERADMIN],
  },
  manageRegistrations: {
    label: "Registration management",
    description: "Review registrations, change categories, and update registration settings.",
    roles: [UserRole.ADMIN, UserRole.SUPERADMIN],
  },
  manageInviteCodes: {
    label: "Invite code management",
    description: "Create, toggle, and delete invite codes.",
    roles: [UserRole.ADMIN, UserRole.SUPERADMIN],
  },
  manageMembers: {
    label: "Member administration",
    description: "View the full user directory.",
    roles: [UserRole.ADMIN, UserRole.SUPERADMIN],
  },
  manageContactInbox: {
    label: "Contact inbox",
    description: "Read, archive, and process contact messages.",
    roles: [UserRole.ADMIN, UserRole.SUPERADMIN],
  },
  manageTournament: {
    label: "Tournament administration",
    description: "Create, edit, activate, and delete tournaments, rules, poules, teams, and matches.",
    roles: [UserRole.ADMIN, UserRole.SUPERADMIN],
  },
  manageTournamentOperations: {
    label: "Tournament operations",
    description: "Check in teams and operate the live tournament board.",
    roles: [UserRole.REFEREE, UserRole.ADMIN, UserRole.SUPERADMIN],
  },
} as const satisfies Record<string, RoleAccessDefinition>;

export const listRoleAccessEntries = (): Array<RoleAccessDefinition & { accessKey: RoleAccessKey }> =>
  Object.entries(ROLE_MANAGER).map(([accessKey, access]) => ({
    accessKey: accessKey as RoleAccessKey,
    ...access,
  }));
