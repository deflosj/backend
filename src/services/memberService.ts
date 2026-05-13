import { HttpError } from "../utils/httpError";
import {
  findPublicMemberProfileById,
  findPublicMemberProfiles,
  upsertMemberProfile,
  MemberProfileData,
} from "../repositories/memberRepository";

export const listMembers = async () => findPublicMemberProfiles();

export const getMember = async (id: number) => {
  const member = await findPublicMemberProfileById(id);

  if (!member) {
    throw new HttpError(404, "Member profile not found");
  }

  return member;
};

export const saveMyProfile = async (userId: number, input: MemberProfileData) => {
  if (!input.firstName.trim() || !input.lastName.trim()) {
    throw new HttpError(400, "First name and last name are required");
  }

  return upsertMemberProfile(userId, {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone: input.phone ?? null,
    bio: input.bio ?? null,
    joinedAt: input.joinedAt ?? null,
    isPublic: input.isPublic ?? true,
  });
};