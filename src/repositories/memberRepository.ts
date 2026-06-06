import { MemberProfile } from "@prisma/client";
import prisma from "../database/prisma";

export interface MemberProfileData {
  firstName: string;
  lastName: string;
  phone?: string | null;
  bio?: string | null;
  joinedAt?: Date | null;
  isPublic?: boolean;
}

const publicSelect = {
  id: true,
  firstName: true,
  lastName: true,
  bio: true,
  joinedAt: true,
} as const;

export type PublicMemberProfile = Pick<MemberProfile, keyof typeof publicSelect>;

export const findPublicMemberProfiles = async (): Promise<PublicMemberProfile[]> => {
  return prisma.memberProfile.findMany({
    select: publicSelect,
    where: {
      isPublic: true,
      user: {
        isActive: true,
      },
    },
    orderBy: [
      {
        lastName: "asc",
      },
      {
        firstName: "asc",
      },
    ],
  });
};

export const findPublicMemberProfileById = async (id: number): Promise<PublicMemberProfile | null> => {
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return prisma.memberProfile.findFirst({
    select: publicSelect,
    where: {
      id,
      isPublic: true,
      user: {
        isActive: true,
      },
    },
  });
};

export const upsertMemberProfile = async (
  userId: number,
  data: MemberProfileData
): Promise<MemberProfile> => {
  return prisma.memberProfile.upsert({
    where: {
      userId,
    },
    create: {
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? null,
      bio: data.bio ?? null,
      joinedAt: data.joinedAt ?? null,
      isPublic: data.isPublic ?? true,
    },
    update: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      bio: data.bio,
      joinedAt: data.joinedAt,
      isPublic: data.isPublic,
    },
  });
};