-- Migration: Replace SheetSegment enum with a Segment relation
-- Preserves existing EASY/MEDIUM/HARD data by seeding matching rows.

-- 1. Create the segments table
CREATE TABLE "segments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "segments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "segments_name_key" ON "segments"("name");

-- 2. Seed defaults so existing enum values can be mapped
INSERT INTO "segments" ("name") VALUES ('Easy'), ('Medium'), ('Hard');

-- 3. Add segment_id column (nullable) to bingo_sheets
ALTER TABLE "bingo_sheets" ADD COLUMN "segment_id" INTEGER;

-- 4. Map existing enum values to the new segment rows
UPDATE "bingo_sheets"
SET "segment_id" = s."id"
FROM "segments" s
WHERE "bingo_sheets"."segment"::TEXT = CASE s."name"
    WHEN 'Easy'   THEN 'EASY'
    WHEN 'Medium' THEN 'MEDIUM'
    WHEN 'Hard'   THEN 'HARD'
END;

-- 5. Add the FK constraint
ALTER TABLE "bingo_sheets"
    ADD CONSTRAINT "bingo_sheets_segment_id_fkey"
    FOREIGN KEY ("segment_id") REFERENCES "segments"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 6. Drop the old enum column
ALTER TABLE "bingo_sheets" DROP COLUMN "segment";

-- 7. Drop the old enum type
DROP TYPE "SheetSegment";
