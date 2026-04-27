-- Step 1: Add the new marketIds array column
ALTER TABLE "bingo_sheet_squares" ADD COLUMN "marketIds" INTEGER[];

-- Step 2: Copy existing single marketId into the array as a one-element array
UPDATE "bingo_sheet_squares" SET "marketIds" = ARRAY["marketId"];

-- Step 3: Make it non-nullable now that all rows have data
ALTER TABLE "bingo_sheet_squares" ALTER COLUMN "marketIds" SET NOT NULL;

-- Step 4: Drop the old single-value column
ALTER TABLE "bingo_sheet_squares" DROP COLUMN "marketId";
