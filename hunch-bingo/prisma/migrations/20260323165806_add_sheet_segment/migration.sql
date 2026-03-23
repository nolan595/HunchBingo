-- CreateEnum
CREATE TYPE "SheetSegment" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- AlterTable
ALTER TABLE "bingo_sheets" ADD COLUMN     "segment" "SheetSegment";
