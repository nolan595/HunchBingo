-- DropForeignKey
ALTER TABLE "game_sheet_results" DROP CONSTRAINT "game_sheet_results_sheetId_fkey";

-- AddForeignKey
ALTER TABLE "game_sheet_results" ADD CONSTRAINT "game_sheet_results_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "bingo_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
