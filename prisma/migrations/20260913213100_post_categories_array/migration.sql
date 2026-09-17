-- Post.category (one value) becomes Post.categories (a list).
-- Separate from the ADD VALUE migration on purpose: Postgres will not let a
-- transaction use an enum value that the same transaction added.

ALTER TABLE "Post" ADD COLUMN "categories" "Category"[];

-- Carry every existing post across as a one-element list.
UPDATE "Post" SET "categories" = ARRAY["category"];

ALTER TABLE "Post" ALTER COLUMN "categories" SET NOT NULL;

DROP INDEX IF EXISTS "Post_category_idx";
ALTER TABLE "Post" DROP COLUMN "category";

-- A btree index is useless against an array; GIN is what makes
-- `categories && ARRAY[...]` (Prisma's hasSome) an index scan.
CREATE INDEX "Post_categories_idx" ON "Post" USING GIN ("categories");
