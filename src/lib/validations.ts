import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["PRIVATE", "COLLECTIVE"]),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const postSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["OFFER", "REQUEST"]),
  category: z.enum([
    "LEGAL",
    "EDUCATION",
    "HEALTH",
    "TECHNOLOGY",
    "MANUAL_WORK",
    "TRANSLATION",
    "OTHER",
  ]),
  description: z.string().min(1, "Description is required"),
  availability: z.string().optional(),
  location: z.string().optional(),
  isRemote: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["PRIVATE", "COLLECTIVE"]),
  location: z.string().optional(),
  bio: z.string().optional(),
  skills: z.string().optional(),
  mission: z.string().optional(),
});

export const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
