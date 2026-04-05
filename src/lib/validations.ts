import { z } from "zod";

function requireSurnameForPrivate(data: { type: string; surname?: string }, ctx: z.RefinementCtx) {
  if (data.type === "PRIVATE" && !data.surname?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Surname is required",
      path: ["surname"],
    });
  }
}

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(100),
  surname: z.string().max(100).optional(),
  type: z.enum(["PRIVATE", "COLLECTIVE"]),
  preferredLanguage: z.enum(["en", "es", "ca"]).optional(),
}).superRefine(requireSurnameForPrivate);

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const postSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
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
  description: z.string().min(1, "Description is required").max(3000),
  availability: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  isRemote: z.boolean().optional(),
  tags: z.array(z.string().max(50)).optional(),
});

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  surname: z.string().max(100).optional(),
  type: z.enum(["PRIVATE", "COLLECTIVE"]),
  location: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
  skills: z.array(z.string().max(50)).optional(),
  mission: z.string().max(1000).optional(),
  preferredLanguage: z.enum(["en", "es", "ca"]).optional(),
  languages: z.array(z.string().max(50)).optional(),
  profilePhoto: z.string().nullable().optional(),
}).superRefine(requireSurnameForPrivate);

export const messageSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(2000),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
