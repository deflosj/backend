import { ContactMessage, MessageStatus } from "@prisma/client";
import prisma from "../database/prisma";

export interface ContactMessageData {
  name: string;
  email: string;
  subject?: string | null;
  body: string;
}

export const createContactMessage = async (data: ContactMessageData): Promise<ContactMessage> => {
  return prisma.contactMessage.create({
    data: {
      name: data.name,
      email: data.email,
      subject: data.subject ?? null,
      body: data.body,
    },
  });
};

export const listContactMessages = async (): Promise<ContactMessage[]> => {
  return prisma.contactMessage.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const markContactMessageRead = async (id: number): Promise<ContactMessage> => {
  return prisma.contactMessage.update({
    where: {
      id,
    },
    data: {
      status: MessageStatus.READ,
      readAt: new Date(),
    },
  });
};

export const archiveContactMessage = async (id: number): Promise<ContactMessage> => {
  return prisma.contactMessage.update({
    where: {
      id,
    },
    data: {
      status: MessageStatus.ARCHIVED,
    },
  });
};