import { HttpError } from "../utils/httpError";
import {
  archiveContactMessage,
  ContactMessageData,
  createContactMessage,
  listContactMessages,
  markContactMessageRead,
} from "../repositories/contactRepository";

export const submitContactMessage = async (input: ContactMessageData) => {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const body = input.body.trim();
  const subject = input.subject?.trim() ?? null;

  if (!name || !email || !body) {
    throw new HttpError(400, "Name, email, and body are required");
  }

  return createContactMessage({
    name,
    email,
    subject,
    body,
  });
};

export const listMessages = async () => listContactMessages();

export const readMessage = async (id: number) => markContactMessageRead(id);

export const archiveMessage = async (id: number) => archiveContactMessage(id);