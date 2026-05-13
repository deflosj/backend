import { Event, NewsPost, Sponsor, SponsorTier } from "@prisma/client";
import prisma from "../database/prisma";

export interface NewsPostData {
  authorId: number;
  title: string;
  slug: string;
  body: string;
  coverUrl?: string | null;
  publishedAt?: Date | null;
}

export interface EventData {
  createdById: number;
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  isPublished?: boolean;
}

export interface SponsorData {
  name: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  tier?: SponsorTier;
  isActive?: boolean;
  sortOrder?: number;
}

export const findPublishedNewsPosts = async (): Promise<NewsPost[]> => {
  return prisma.newsPost.findMany({
    where: {
      publishedAt: {
        not: null,
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
  });
};

export const findPublishedNewsPostBySlug = async (slug: string): Promise<NewsPost | null> => {
  return prisma.newsPost.findFirst({
    where: {
      slug,
      publishedAt: {
        not: null,
      },
    },
  });
};

export const findNewsPostById = async (id: number): Promise<NewsPost | null> => {
  return prisma.newsPost.findUnique({
    where: {
      id,
    },
  });
};

export const createNewsPost = async (data: NewsPostData): Promise<NewsPost> => {
  return prisma.newsPost.create({
    data: {
      authorId: data.authorId,
      title: data.title,
      slug: data.slug,
      body: data.body,
      coverUrl: data.coverUrl ?? null,
      publishedAt: data.publishedAt ?? null,
    },
  });
};

export const updateNewsPost = async (
  id: number,
  data: Partial<NewsPostData>
): Promise<NewsPost> => {
  return prisma.newsPost.update({
    where: {
      id,
    },
    data: {
      authorId: data.authorId,
      title: data.title,
      slug: data.slug,
      body: data.body,
      coverUrl: data.coverUrl,
      publishedAt: data.publishedAt,
    },
  });
};

export const findPublishedEvents = async (): Promise<Event[]> => {
  return prisma.event.findMany({
    where: {
      isPublished: true,
    },
    orderBy: {
      startsAt: "asc",
    },
  });
};

export const findEventById = async (id: number): Promise<Event | null> => {
  return prisma.event.findUnique({
    where: {
      id,
    },
  });
};

export const createEvent = async (data: EventData): Promise<Event> => {
  return prisma.event.create({
    data: {
      createdById: data.createdById,
      title: data.title,
      description: data.description ?? null,
      location: data.location ?? null,
      startsAt: data.startsAt,
      endsAt: data.endsAt ?? null,
      isPublished: data.isPublished ?? false,
    },
  });
};

export const updateEvent = async (id: number, data: Partial<EventData>): Promise<Event> => {
  return prisma.event.update({
    where: {
      id,
    },
    data: {
      createdById: data.createdById,
      title: data.title,
      description: data.description,
      location: data.location,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      isPublished: data.isPublished,
    },
  });
};

export const findActiveSponsors = async (): Promise<Sponsor[]> => {
  return prisma.sponsor.findMany({
    where: {
      isActive: true,
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        name: "asc",
      },
    ],
  });
};

export const findSponsorById = async (id: number): Promise<Sponsor | null> => {
  return prisma.sponsor.findUnique({
    where: {
      id,
    },
  });
};

export const createSponsor = async (data: SponsorData): Promise<Sponsor> => {
  return prisma.sponsor.create({
    data: {
      name: data.name,
      logoUrl: data.logoUrl ?? null,
      websiteUrl: data.websiteUrl ?? null,
      tier: data.tier ?? "STANDARD",
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
  });
};

export const updateSponsor = async (id: number, data: Partial<SponsorData>): Promise<Sponsor> => {
  return prisma.sponsor.update({
    where: {
      id,
    },
    data: {
      name: data.name,
      logoUrl: data.logoUrl,
      websiteUrl: data.websiteUrl,
      tier: data.tier,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
    },
  });
};