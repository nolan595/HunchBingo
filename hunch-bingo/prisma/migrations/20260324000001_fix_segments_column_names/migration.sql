-- Rename segments columns to camelCase (matching this project's column naming convention)
ALTER TABLE "segments" RENAME COLUMN "created_at" TO "createdAt";

-- Rename segment_id FK column in bingo_sheets to match camelCase convention
ALTER TABLE "bingo_sheets" DROP CONSTRAINT "bingo_sheets_segment_id_fkey";
ALTER TABLE "bingo_sheets" RENAME COLUMN "segment_id" TO "segmentId";
ALTER TABLE "bingo_sheets"
    ADD CONSTRAINT "bingo_sheets_segmentId_fkey"
    FOREIGN KEY ("segmentId") REFERENCES "segments"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
