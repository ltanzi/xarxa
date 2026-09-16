import { z } from "zod";
import { CATEGORY_KEYS, MAX_CATEGORIES_PER_POST } from "./categories";
import { isBarcelonaBarri, isInBarcelona } from "./barcelona";

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

// One email schema for every auth surface. Normalizing here (not per-route)
// is load-bearing: register/sign-in used to store and look up the email
// as-typed while forgot-password lowercased it, so a user who registered
// with any uppercase could never reset their password (the lookup missed,
// and the anti-enumeration 200 hid it). Postgres uniqueness is also
// case-sensitive, so without this Bob@x.com and bob@x.com were two accounts.
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, "Name is required").max(100),
  surname: z.string().max(100).optional(),
  type: z.enum(["PRIVATE", "COLLECTIVE"]),
  preferredLanguage: z.enum(["en", "es", "ca"]).optional(),
}).superRefine(requireSurnameForPrivate);

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const postSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or fewer"),
    type: z.enum(["OFFER", "REQUEST"]),
    // The form starts with nothing chosen, so the empty case is a real user
    // path, not a malformed request — it needs a sentence, not Zod's
    // "Invalid option: expected one of MANUAL_WORK|MOVING|…".
    categories: z
      .array(z.enum(CATEGORY_KEYS, { error: "Choose a category" }))
      .min(1, "Choose a category")
      .max(MAX_CATEGORIES_PER_POST, `Pick up to ${MAX_CATEGORIES_PER_POST} categories`)
      // A double-click on the same option shouldn't be able to store it twice.
      .transform((v) => [...new Set(v)]),
    categoryOther: z.string().max(50, "Keep it under 50 characters").optional().nullable(),
    description: z.string().min(1, "Description is required").max(3000),
    urgency: z.enum(["LOW", "NORMAL", "URGENT"]).optional(),
    availability: z.string().max(200).optional(),
    location: z.string().max(200).optional(),
    neighborhood: z.string().max(80).optional().nullable(),
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
  })
  // Normalise here rather than in each route: both POST and PATCH spread
  // parsed.data straight into Prisma. Without this, switching a post from
  // OTHER off the list would leave its old subcategory behind.
  .transform((data) => ({
    ...data,
    categoryOther: data.categories.includes("OTHER")
      ? data.categoryOther?.trim() || null
      : null,
    // Same rule for the barri: it only means anything on a Barcelona post,
    // so moving a post to another city drops it rather than leaving a
    // Barcelona neighbourhood stamped on a post in Girona. Unknown values
    // are dropped too — the picker only ever emits real barris, so anything
    // else arrived by hand and isn't worth storing.
    neighborhood:
      isInBarcelona(data.location) && data.neighborhood && isBarcelonaBarri(data.neighborhood)
        ? data.neighborhood
        : null,
  }));

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  surname: z.string().max(100).optional(),
  type: z.enum(["PRIVATE", "COLLECTIVE"]),
  location: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
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

export const feedbackSchema = z.object({
  message: z.string().trim().min(1, "Write something first").max(2000, "Keep it under 2000 characters"),
  // Which page they were on — context that makes vague feedback actionable.
  // No reply address: only signed-in people can send, so we already have one.
  path: z.string().max(200).optional().nullable(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
