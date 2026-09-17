-- Free-text subcategory, filled in when the author picks OTHER.
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "categoryOther" TEXT;

-- TRANSLATION is being replaced by MUSIC, not renamed: the two are unrelated.
-- No post used TRANSLATION when this was written, but the enum swap below
-- casts via text and would abort the whole deploy if one appeared in the
-- meantime. Re-file any such post under OTHER and keep its old meaning in the
-- new subcategory column, so the migration is safe whenever it runs.
UPDATE "Post" SET "category" = 'OTHER', "categoryOther" = 'Translation' WHERE "category" = 'TRANSLATION';

-- AlterEnum
BEGIN;
CREATE TYPE "Category_new" AS ENUM ('LEGAL', 'EDUCATION', 'HEALTH', 'TECHNOLOGY', 'MANUAL_WORK', 'MUSIC', 'OTHER');
ALTER TABLE "Post" ALTER COLUMN "category" TYPE "Category_new" USING ("category"::text::"Category_new");
ALTER TYPE "Category" RENAME TO "Category_old";
ALTER TYPE "Category_new" RENAME TO "Category";
DROP TYPE "public"."Category_old";
COMMIT;
