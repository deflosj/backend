import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../app";
import config from "../config";
import * as contentService from "../services/contentService";
import * as memberService from "../services/memberService";
import * as contactService from "../services/contactService";

jest.mock("../services/contentService", () => ({
  __esModule: true,
  listNewsPosts: jest.fn(),
  getNewsPost: jest.fn(),
  createNews: jest.fn(),
  editNews: jest.fn(),
  listEvents: jest.fn(),
  createNewEvent: jest.fn(),
  editEvent: jest.fn(),
  listSponsors: jest.fn(),
  createNewSponsor: jest.fn(),
  editSponsor: jest.fn(),
}));

jest.mock("../services/memberService", () => ({
  __esModule: true,
  listMembers: jest.fn(),
  getMember: jest.fn(),
  saveMyProfile: jest.fn(),
}));

jest.mock("../services/contactService", () => ({
  __esModule: true,
  submitContactMessage: jest.fn(),
  listMessages: jest.fn(),
  readMessage: jest.fn(),
  archiveMessage: jest.fn(),
}));

const contentMock = contentService as jest.Mocked<typeof contentService>;
const memberMock = memberService as jest.Mocked<typeof memberService>;
const contactMock = contactService as jest.Mocked<typeof contactService>;

describe("Site feature routes", () => {
  const app = createApp();
  const adminToken = jwt.sign(
    {
      email: "admin@example.com",
      username: "admin",
      role: "ADMIN",
    },
    config.jwtSecret,
    {
      subject: "1",
    }
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns published news, events, and sponsors", async () => {
    contentMock.listNewsPosts.mockResolvedValue([
      {
        id: 1,
        authorId: 1,
        title: "Season opens",
        slug: "season-opens",
        body: "New season is live",
        coverUrl: null,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    contentMock.listEvents.mockResolvedValue([]);
    contentMock.listSponsors.mockResolvedValue([]);

    const newsResponse = await request(app).get("/content/news");
    const eventsResponse = await request(app).get("/content/events");
    const sponsorsResponse = await request(app).get("/content/sponsors");

    expect(newsResponse.status).toBe(200);
    expect(newsResponse.body).toHaveLength(1);
    expect(eventsResponse.status).toBe(200);
    expect(sponsorsResponse.status).toBe(200);
  });

  it("lets an admin create content", async () => {
    contentMock.createNews.mockResolvedValue({
      id: 2,
      authorId: 1,
      title: "Update",
      slug: "update",
      body: "Body",
      coverUrl: null,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app)
      .post("/content/news")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Update",
        body: "Body",
        isPublished: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.slug).toBe("update");
  });

  it("returns public members and public profile details", async () => {
    memberMock.listMembers.mockResolvedValue([
      {
        id: 1,
        userId: 1,
        firstName: "Alex",
        lastName: "Janssen",
        phone: null,
        bio: null,
        joinedAt: null,
        isPublic: true,
      },
    ]);
    memberMock.getMember.mockResolvedValue({
      id: 1,
      userId: 1,
      firstName: "Alex",
      lastName: "Janssen",
      phone: null,
      bio: null,
      joinedAt: null,
      isPublic: true,
    });

    const listResponse = await request(app).get("/members");
    const detailResponse = await request(app).get("/members/1");

    expect(listResponse.status).toBe(200);
    expect(detailResponse.status).toBe(200);
  });

  it("accepts contact messages and allows admin moderation", async () => {
    contactMock.submitContactMessage.mockResolvedValue({
      id: 1,
      name: "Visitor",
      email: "visitor@example.com",
      subject: "Hello",
      body: "Question",
      status: "UNREAD",
      createdAt: new Date(),
      readAt: null,
    });
    contactMock.listMessages.mockResolvedValue([]);
    contactMock.readMessage.mockResolvedValue({
      id: 1,
      name: "Visitor",
      email: "visitor@example.com",
      subject: "Hello",
      body: "Question",
      status: "READ",
      createdAt: new Date(),
      readAt: new Date(),
    });

    const publicResponse = await request(app).post("/contact/messages").send({
      name: "Visitor",
      email: "visitor@example.com",
      body: "Question",
    });

    const adminListResponse = await request(app)
      .get("/contact/messages")
      .set("Authorization", `Bearer ${adminToken}`);

    const adminReadResponse = await request(app)
      .patch("/contact/messages/1/read")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(publicResponse.status).toBe(201);
    expect(adminListResponse.status).toBe(200);
    expect(adminReadResponse.status).toBe(200);
  });
});