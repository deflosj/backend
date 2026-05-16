import {
  listMembers,
  getMember,
  saveMyProfile,
} from "../services/memberService";
import {
  findPublicMemberProfileById,
  findPublicMemberProfiles,
  upsertMemberProfile,
} from "../repositories/memberRepository";

jest.mock("../repositories/memberRepository");

const memberRepositoryMock = {
  findPublicMemberProfileById: findPublicMemberProfileById as jest.Mock,
  findPublicMemberProfiles: findPublicMemberProfiles as jest.Mock,
  upsertMemberProfile: upsertMemberProfile as jest.Mock,
};

describe("memberService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listMembers", () => {
    it("returns list of public members", async () => {
      const members = [
        {
          id: 1,
          userId: 1,
          firstName: "John",
          lastName: "Doe",
          phone: null,
          bio: null,
          joinedAt: null,
          isPublic: true,
        },
      ];

      memberRepositoryMock.findPublicMemberProfiles.mockResolvedValue(members);

      const result = await listMembers();

      expect(result).toEqual(members);
      expect(memberRepositoryMock.findPublicMemberProfiles).toHaveBeenCalled();
    });
  });

  describe("getMember", () => {
    it("throws 404 when member not found", async () => {
      memberRepositoryMock.findPublicMemberProfileById.mockResolvedValue(null);

      await expect(getMember(99)).rejects.toMatchObject({
        statusCode: 404,
        message: "Member profile not found",
      });
    });

    it("returns member when found", async () => {
      const member = {
        id: 1,
        userId: 1,
        firstName: "John",
        lastName: "Doe",
        phone: "123456789",
        bio: "A member",
        joinedAt: new Date(),
        isPublic: true,
      };

      memberRepositoryMock.findPublicMemberProfileById.mockResolvedValue(member);

      const result = await getMember(1);

      expect(result).toEqual(member);
    });
  });

  describe("saveMyProfile", () => {
    it("throws 400 when firstName is empty", async () => {
      await expect(
        saveMyProfile(1, {
          firstName: "",
          lastName: "Doe",
          phone: null,
          bio: null,
          joinedAt: null,
          isPublic: true,
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "First name and last name are required",
      });

      expect(memberRepositoryMock.upsertMemberProfile).not.toHaveBeenCalled();
    });

    it("throws 400 when lastName is empty", async () => {
      await expect(
        saveMyProfile(1, {
          firstName: "John",
          lastName: "   ",
          phone: null,
          bio: null,
          joinedAt: null,
          isPublic: true,
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "First name and last name are required",
      });
    });

    it("trims firstName and lastName", async () => {
      memberRepositoryMock.upsertMemberProfile.mockResolvedValue({
        id: 1,
        userId: 1,
        firstName: "John",
        lastName: "Doe",
        phone: null,
        bio: null,
        joinedAt: null,
        isPublic: true,
      });

      await saveMyProfile(1, {
        firstName: "  John  ",
        lastName: "  Doe  ",
        phone: null,
        bio: null,
        joinedAt: null,
        isPublic: true,
      });

      expect(memberRepositoryMock.upsertMemberProfile).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          firstName: "John",
          lastName: "Doe",
        })
      );
    });

    it("defaults isPublic to true when not provided", async () => {
      memberRepositoryMock.upsertMemberProfile.mockResolvedValue({
        id: 1,
        userId: 1,
        firstName: "John",
        lastName: "Doe",
        phone: null,
        bio: null,
        joinedAt: null,
        isPublic: true,
      });

      await saveMyProfile(1, {
        firstName: "John",
        lastName: "Doe",
        phone: null,
        bio: null,
        joinedAt: null,
      });

      expect(memberRepositoryMock.upsertMemberProfile).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          isPublic: true,
        })
      );
    });

    it("saves optional fields (phone, bio, joinedAt)", async () => {
      const joinedDate = new Date("2025-01-01");
      memberRepositoryMock.upsertMemberProfile.mockResolvedValue({
        id: 1,
        userId: 1,
        firstName: "John",
        lastName: "Doe",
        phone: "123456789",
        bio: "A bio",
        joinedAt: joinedDate,
        isPublic: true,
      });

      await saveMyProfile(1, {
        firstName: "John",
        lastName: "Doe",
        phone: "123456789",
        bio: "A bio",
        joinedAt: joinedDate,
        isPublic: true,
      });

      expect(memberRepositoryMock.upsertMemberProfile).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          phone: "123456789",
          bio: "A bio",
          joinedAt: joinedDate,
        })
      );
    });
  });
});

import {
  listNewsPosts,
  getNewsPost,
  createNews,
  listEvents,
  createNewEvent,
  listSponsors,
  createNewSponsor,
} from "../services/contentService";
import {
  findPublishedNewsPosts,
  findPublishedNewsPostBySlug,
  createNewsPost,
  findNewsPostById,
  updateNewsPost,
  findPublishedEvents,
  createEvent,
  findEventById,
  updateEvent,
  findActiveSponsors,
  createSponsor,
  findSponsorById,
  updateSponsor,
} from "../repositories/contentRepository";

jest.mock("../repositories/contentRepository");

const contentRepositoryMock = {
  findPublishedNewsPosts: findPublishedNewsPosts as jest.Mock,
  findPublishedNewsPostBySlug: findPublishedNewsPostBySlug as jest.Mock,
  createNewsPost: createNewsPost as jest.Mock,
  findNewsPostById: findNewsPostById as jest.Mock,
  updateNewsPost: updateNewsPost as jest.Mock,
  findPublishedEvents: findPublishedEvents as jest.Mock,
  createEvent: createEvent as jest.Mock,
  findEventById: findEventById as jest.Mock,
  updateEvent: updateEvent as jest.Mock,
  findActiveSponsors: findActiveSponsors as jest.Mock,
  createSponsor: createSponsor as jest.Mock,
  findSponsorById: findSponsorById as jest.Mock,
  updateSponsor: updateSponsor as jest.Mock,
};

describe("contentService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("News", () => {
    it("listNewsPosts returns published posts", async () => {
      const posts = [
        {
          id: 1,
          authorId: 1,
          title: "Post 1",
          slug: "post-1",
          body: "Body",
          coverUrl: null,
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      contentRepositoryMock.findPublishedNewsPosts.mockResolvedValue(posts);
      const result = await listNewsPosts();

      expect(result).toEqual(posts);
    });

    it("getNewsPost throws 404 when not found", async () => {
      contentRepositoryMock.findPublishedNewsPostBySlug.mockResolvedValue(null);

      await expect(getNewsPost("unknown")).rejects.toMatchObject({
        statusCode: 404,
        message: "News post not found",
      });
    });

    it("createNews generates slug from title", async () => {
      contentRepositoryMock.createNewsPost.mockResolvedValue({
        id: 1,
        authorId: 1,
        title: "My Post Title",
        slug: "my-post-title",
        body: "Body",
        coverUrl: null,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await createNews({
        authorId: 1,
        title: "My Post Title",
        body: "Body",
        isPublished: true,
      });

      expect(contentRepositoryMock.createNewsPost).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: "my-post-title",
        })
      );
    });

    it("createNews throws 400 when title is empty", async () => {
      await expect(
        createNews({
          authorId: 1,
          title: "",
          body: "Body",
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Title is required",
      });
    });

    it("createNews throws 400 when body is empty", async () => {
      await expect(
        createNews({
          authorId: 1,
          title: "Title",
          body: "   ",
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Body is required",
      });
    });
  });

  describe("Events", () => {
    it("listEvents returns published events", async () => {
      const events = [
        {
          id: 1,
          createdById: 1,
          title: "Event 1",
          description: null,
          location: null,
          startsAt: new Date(),
          endsAt: null,
          isPublished: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      contentRepositoryMock.findPublishedEvents.mockResolvedValue(events);
      const result = await listEvents();

      expect(result).toEqual(events);
    });

    it("createNewEvent throws 400 when startsAt is invalid", async () => {
      await expect(
        createNewEvent({
          createdById: 1,
          title: "Event",
          startsAt: "invalid-date",
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "A valid startsAt date is required",
      });
    });

    it("createNewEvent throws 400 when title is empty", async () => {
      await expect(
        createNewEvent({
          createdById: 1,
          title: "  ",
          startsAt: new Date().toISOString(),
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Title is required",
      });
    });
  });

  describe("Sponsors", () => {
    it("listSponsors returns active sponsors", async () => {
      const sponsors = [
        {
          id: 1,
          name: "Sponsor 1",
          logoUrl: null,
          websiteUrl: null,
          tier: "STANDARD",
          isActive: true,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      contentRepositoryMock.findActiveSponsors.mockResolvedValue(sponsors);
      const result = await listSponsors();

      expect(result).toEqual(sponsors);
    });

    it("createNewSponsor throws 400 when name is empty", async () => {
      await expect(
        createNewSponsor({
          name: "",
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Name is required",
      });
    });

    it("createNewSponsor defaults tier to STANDARD", async () => {
      contentRepositoryMock.createSponsor.mockResolvedValue({
        id: 1,
        name: "Sponsor",
        logoUrl: null,
        websiteUrl: null,
        tier: "STANDARD",
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await createNewSponsor({
        name: "Sponsor",
      });

      expect(contentRepositoryMock.createSponsor).toHaveBeenCalledWith(
        expect.objectContaining({
          tier: "STANDARD",
        })
      );
    });
  });
});

import {
  submitContactMessage,
  listMessages,
  readMessage,
  archiveMessage,
} from "../services/contactService";
import {
  createContactMessage,
  listContactMessages,
  markContactMessageRead,
  archiveContactMessage,
} from "../repositories/contactRepository";

jest.mock("../repositories/contactRepository");

const contactRepositoryMock = {
  createContactMessage: createContactMessage as jest.Mock,
  listContactMessages: listContactMessages as jest.Mock,
  markContactMessageRead: markContactMessageRead as jest.Mock,
  archiveContactMessage: archiveContactMessage as jest.Mock,
};

describe("contactService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("submitContactMessage", () => {
    it("throws 400 when name is empty", async () => {
      await expect(
        submitContactMessage({
          name: "   ",
          email: "test@example.com",
          body: "Message",
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Name, email, and body are required",
      });
    });

    it("throws 400 when email is empty", async () => {
      await expect(
        submitContactMessage({
          name: "John",
          email: "  ",
          body: "Message",
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Name, email, and body are required",
      });
    });

    it("throws 400 when body is empty", async () => {
      await expect(
        submitContactMessage({
          name: "John",
          email: "test@example.com",
          body: "",
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Name, email, and body are required",
      });
    });

    it("trims and lowercases email", async () => {
      contactRepositoryMock.createContactMessage.mockResolvedValue({
        id: 1,
        name: "John",
        email: "test@example.com",
        subject: null,
        body: "Message",
        status: "UNREAD",
        createdAt: new Date(),
        readAt: null,
      });

      await submitContactMessage({
        name: "John",
        email: "  TEST@EXAMPLE.COM  ",
        body: "Message",
      });

      expect(contactRepositoryMock.createContactMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "test@example.com",
        })
      );
    });

    it("trims name and body", async () => {
      contactRepositoryMock.createContactMessage.mockResolvedValue({
        id: 1,
        name: "John",
        email: "test@example.com",
        subject: null,
        body: "Message",
        status: "UNREAD",
        createdAt: new Date(),
        readAt: null,
      });

      await submitContactMessage({
        name: "  John  ",
        email: "test@example.com",
        body: "  Message  ",
      });

      expect(contactRepositoryMock.createContactMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "John",
          body: "Message",
        })
      );
    });

    it("accepts optional subject", async () => {
      contactRepositoryMock.createContactMessage.mockResolvedValue({
        id: 1,
        name: "John",
        email: "test@example.com",
        subject: "My Subject",
        body: "Message",
        status: "UNREAD",
        createdAt: new Date(),
        readAt: null,
      });

      await submitContactMessage({
        name: "John",
        email: "test@example.com",
        subject: "  My Subject  ",
        body: "Message",
      });

      expect(contactRepositoryMock.createContactMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "My Subject",
        })
      );
    });
  });

  describe("listMessages", () => {
    it("returns all messages", async () => {
      const messages = [
        {
          id: 1,
          name: "John",
          email: "test@example.com",
          subject: null,
          body: "Message",
          status: "UNREAD",
          createdAt: new Date(),
          readAt: null,
        },
      ];

      contactRepositoryMock.listContactMessages.mockResolvedValue(messages);
      const result = await listMessages();

      expect(result).toEqual(messages);
    });
  });

  describe("readMessage", () => {
    it("marks message as read", async () => {
      const message = {
        id: 1,
        name: "John",
        email: "test@example.com",
        subject: null,
        body: "Message",
        status: "READ",
        createdAt: new Date(),
        readAt: new Date(),
      };

      contactRepositoryMock.markContactMessageRead.mockResolvedValue(message);
      const result = await readMessage(1);

      expect(result).toEqual(message);
      expect(contactRepositoryMock.markContactMessageRead).toHaveBeenCalledWith(1);
    });
  });

  describe("archiveMessage", () => {
    it("archives message", async () => {
      const message = {
        id: 1,
        name: "John",
        email: "test@example.com",
        subject: null,
        body: "Message",
        status: "ARCHIVED",
        createdAt: new Date(),
        readAt: null,
      };

      contactRepositoryMock.archiveContactMessage.mockResolvedValue(message);
      const result = await archiveMessage(1);

      expect(result).toEqual(message);
      expect(contactRepositoryMock.archiveContactMessage).toHaveBeenCalledWith(1);
    });
  });
});
