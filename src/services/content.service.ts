import { SponsorTier } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import {
  createEvent,
  createNewsPost,
  createSponsor,
  findActiveSponsors,
  findAllEvents,
  findEventById,
  findNewsPostById,
  findPublishedEvents,
  findPublishedNewsPostBySlug,
  findPublishedNewsPosts,
  findSponsorById,
  updateEvent,
  updateNewsPost,
  updateSponsor,
} from "../repositories/contentRepository";

export interface NewsPostInput {
  authorId: number;
  title: string;
  slug?: string;
  body: string;
  coverUrl?: string | null;
  isPublished?: boolean;
}

export interface EventInput {
  createdById: number;
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: string;
  endsAt?: string | null;
  isPublished?: boolean;
}

export interface SponsorInput {
  name: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  tier?: SponsorTier;
  isActive?: boolean;
  sortOrder?: number;
}

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const ensureValue = (value: string | undefined | null, message: string): string => {
  if (!value || !value.trim()) {
    throw new HttpError(400, message);
  }

  return value.trim();
};

export const listNewsPosts = async () => findPublishedNewsPosts();

export const getNewsPost = async (slug: string) => {
  const post = await findPublishedNewsPostBySlug(slug);

  if (!post) {
    throw new HttpError(404, "News post not found");
  }

  return post;
};

export const createNews = async (input: NewsPostInput) => {
  const title = ensureValue(input.title, "Title is required");
  const body = ensureValue(input.body, "Body is required");
  const slug = slugify(input.slug ?? title);

  return createNewsPost({
    authorId: input.authorId,
    title,
    slug,
    body,
    coverUrl: input.coverUrl ?? null,
    publishedAt: input.isPublished ? new Date() : null,
  });
};

export const editNews = async (id: number, input: Partial<NewsPostInput>) => {
  const existing = await getNewsPostByIdOrThrow(id);
  const nextTitle = input.title ? ensureValue(input.title, "Title is required") : existing.title;
  const nextBody = input.body ? ensureValue(input.body, "Body is required") : existing.body;
  const nextSlug = input.slug ? slugify(input.slug) : existing.slug;
  const nextPublishedAt =
    typeof input.isPublished === "boolean"
      ? input.isPublished
        ? existing.publishedAt ?? new Date()
        : null
      : existing.publishedAt;

  return updateNewsPost(id, {
    authorId: input.authorId ?? existing.authorId,
    title: nextTitle,
    slug: nextSlug,
    body: nextBody,
    coverUrl: input.coverUrl ?? existing.coverUrl,
    publishedAt: nextPublishedAt,
  });
};

export const listEvents = async () => findPublishedEvents();

export const listAllEvents = async () => findAllEvents();

export const getEvent = async (id: number) => getEventByIdOrThrow(id);

export const createNewEvent = async (input: EventInput) => {
  const title = ensureValue(input.title, "Title is required");
  const startsAt = new Date(input.startsAt);

  if (Number.isNaN(startsAt.getTime())) {
    throw new HttpError(400, "A valid startsAt date is required");
  }

  return createEvent({
    createdById: input.createdById,
    title,
    description: input.description ?? null,
    location: input.location ?? null,
    startsAt,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    isPublished: input.isPublished ?? false,
  });
};

export const editEvent = async (id: number, input: Partial<EventInput>) => {
  const existing = await getEventByIdOrThrow(id);
  const startsAt = input.startsAt ? new Date(input.startsAt) : existing.startsAt;

  if (input.startsAt && Number.isNaN(startsAt.getTime())) {
    throw new HttpError(400, "A valid startsAt date is required");
  }

  return updateEvent(id, {
    createdById: input.createdById ?? existing.createdById,
    title: input.title ? ensureValue(input.title, "Title is required") : existing.title,
    description: input.description ?? existing.description,
    location: input.location ?? existing.location,
    startsAt,
    endsAt: input.endsAt ? new Date(input.endsAt) : input.endsAt === null ? null : existing.endsAt,
    isPublished: input.isPublished ?? existing.isPublished,
  });
};

export const listSponsors = async () => findActiveSponsors();

export const createNewSponsor = async (input: SponsorInput) => {
  const name = ensureValue(input.name, "Name is required");

  return createSponsor({
    name,
    logoUrl: input.logoUrl ?? null,
    websiteUrl: input.websiteUrl ?? null,
    tier: input.tier ?? SponsorTier.STANDARD,
    isActive: input.isActive ?? true,
    sortOrder: input.sortOrder ?? 0,
  });
};

export const editSponsor = async (id: number, input: Partial<SponsorInput>) => {
  await getSponsorByIdOrThrow(id);

  return updateSponsor(id, {
    name: input.name ? ensureValue(input.name, "Name is required") : undefined,
    logoUrl: input.logoUrl,
    websiteUrl: input.websiteUrl,
    tier: input.tier,
    isActive: input.isActive,
    sortOrder: input.sortOrder,
  });
};

const getNewsPostByIdOrThrow = async (id: number) => {
  const post = await findNewsPostById(id);

  if (!post) {
    throw new HttpError(404, "News post not found");
  }

  return post;
};

const getEventByIdOrThrow = async (id: number) => {
  const event = await findEventById(id);

  if (!event) {
    throw new HttpError(404, "Event not found");
  }

  return event;
};

const getSponsorByIdOrThrow = async (id: number) => {
  const sponsor = await findSponsorById(id);

  if (!sponsor) {
    throw new HttpError(404, "Sponsor not found");
  }

  return sponsor;
};