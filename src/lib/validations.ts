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

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(new RegExp("\\p{Lu}", "u"), "Password must contain at least one uppercase letter")
  .regex(new RegExp("[^\\p{L}\\p{N}]", "u"), "Password must contain at least one special character");

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
  name: z.string().min(1, "Name is required").max(100),
  surname: z.string().max(100).optional(),
  type: z.enum(["PRIVATE", "COLLECTIVE"]),
  preferredLanguage: z.enum(["en", "es", "ca"]).optional(),
}).superRefine(requireSurnameForPrivate);

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const postSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or fewer"),
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
    urgency: z.enum(["LOW", "NORMAL", "URGENT"]).optional(),
    availability: z.string().max(200).optional(),
    location: z.string().max(200).optional(),
    isRemote: z.boolean().optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
  })
  .superRefine((data, ctx) => {
    const hasLocation = !!data.location && data.location.trim().length > 0;
    if (!hasLocation && !data.isRemote) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Set a location or mark this as remote",
        path: ["location"],
      });
    }
  });

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  surname: z.string().max(100).optional(),
  type: z.enum(["PRIVATE", "COLLECTIVE"]),
  location: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
  skills: z.array(z.string().max(50)).max(20).optional(),
  preferredLanguage: z.enum(["en", "es", "ca"]).optional(),
  languages: z.array(z.string().max(50)).max(20).optional(),
  profilePhoto: z.string().nullable().optional(),
}).superRefine(requireSurnameForPrivate);

export const messageSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(2000),
});

export const connectionRequestSchema = z.object({
  postId: z.string().min(1).max(40),
});

export const reportSchema = z.object({
  reason: z.enum(["HATE_SPEECH", "HARASSMENT", "SPAM", "INAPPROPRIATE", "OTHER"]),
  details: z.string().trim().max(1000).optional(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(new RegExp("\\p{Lu}", "u"), "Password must contain at least one uppercase letter")
    .regex(new RegExp("[^\\p{L}\\p{N}]", "u"), "Password must contain at least one special character"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
