-- Add enabled flag to bingo_sheets (default true — all existing sheets stay active)
ALTER TABLE "bingo_sheets" ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true;
