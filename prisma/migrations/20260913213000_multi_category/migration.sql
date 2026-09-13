-- Ten new categories, and posts can now carry several at once.

-- New enum values. ADD VALUE cannot run inside the same transaction that
-- then uses the value, so these come first, on their own.
ALTER TYPE "Category" ADD VALUE IF NOT EXISTS 'MOVING';
ALTER TYPE "Category" ADD VALUE IF NOT EXISTS 'GARDENING';
ALTER TYPE "Category" ADD VALUE IF NOT EXISTS 'ANIMALS';
ALTER TYPE "Category" ADD VALUE IF NOT EXISTS 'COOKING';
ALTER TYPE "Category" ADD VALUE IF NOT EXISTS 'CARE';
ALTER TYPE "Category" ADD VALUE IF NOT EXISTS 'LANGUAGES';
ALTER TYPE "Category" ADD VALUE IF NOT EXISTS 'PAPERWORK';
ALTER TYPE "Category" ADD VALUE IF NOT EXISTS 'COMMUNICATION';
ALTER TYPE "Category" ADD VALUE IF NOT EXISTS 'CREATIVE';
ALTER TYPE "Category" ADD VALUE IF NOT EXISTS 'EVENTS';
