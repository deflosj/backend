export const INVITE_TOKEN_TTL_DAYS = 7;

export const getInviteTokenExpiresAt = (issuedAt: Date = new Date()) => {
  const expiresAt = new Date(issuedAt);
  expiresAt.setDate(expiresAt.getDate() + INVITE_TOKEN_TTL_DAYS);
  return expiresAt;
};

export const isInviteTokenExpired = (expiresAt?: Date | null, now: Date = new Date()) =>
  !expiresAt || expiresAt.getTime() <= now.getTime();