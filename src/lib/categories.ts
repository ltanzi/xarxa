import type { Category as PrismaCategory } from "@prisma/client";

/**
 * The one list of post categories.
 *
 * It used to be copy-pasted into the board page, the posts API, the post
 * form and the filters; four copies was survivable at seven values and a
 * bug waiting to happen at seventeen. Everything that needs the list —
 * including the Zod schema that guards the API — imports it from here.
 *
 * Order is deliberate and shared by the form and the filters: hands-on
 * work first, then care and learning, then admin, then culture. OTHER
 * stays last, where a fallback belongs.
 *
 * Adding one means: add the value here, add the same value to the
 * `Category` enum in prisma/schema.prisma, migrate, and add a label under
 * `categories.` in all three locale files. NOTHING CHECKS THE LABELS —
 * there is no test suite, and a missing one ships as the literal string
 * "categories.YOUR_KEY" on every card, in every language. Grep the three
 * files in src/i18n/locales/ before you push.
 */
export const CATEGORY_KEYS = [
  "MANUAL_WORK",
  "MOVING",
  "GARDENING",
  "ANIMALS",
  "COOKING",
  "CARE",
  "HEALTH",
  "EDUCATION",
  "LANGUAGES",
  "PAPERWORK",
  "LEGAL",
  "TECHNOLOGY",
  "COMMUNICATION",
  "CREATIVE",
  "MUSIC",
  "EVENTS",
  "OTHER",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

/**
 * Pins this list equal to the Prisma `Category` enum, in both directions.
 *
 * A key here that Prisma lacks already fails the build where these values
 * reach a query. The reverse did not: a value added to schema.prisma alone
 * compiles fine, because CategoryKey[] is assignable to Category[] — and
 * then it never appears in the form or filters, is dropped from URLs by
 * parseCategoryParam, and renders on cards as the literal string
 * "categories.YOUR_KEY" because no locale has a label for it.
 *
 * `import type` so nothing from @prisma/client reaches the client bundle.
 * Zero runtime cost: these are types, erased at compile.
 */
type AssertNever<T extends never> = T;
type _NoValueOnlyInPrisma = AssertNever<Exclude<PrismaCategory, CategoryKey>>;
type _NoValueOnlyHere = AssertNever<Exclude<CategoryKey, PrismaCategory>>;

/** Most posts are one thing. The cap stops a post claiming the whole board. */
export const MAX_CATEGORIES_PER_POST = 3;

export function isCategoryKey(value: string): value is CategoryKey {
  return (CATEGORY_KEYS as readonly string[]).includes(value);
}

/** Parse a `?category=A,B` filter value into known keys, ignoring junk. */
export function parseCategoryParam(raw: string | undefined | null): CategoryKey[] {
  if (!raw) return [];
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(isCategoryKey))];
}
