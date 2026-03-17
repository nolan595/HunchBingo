-- DropForeignKey
ALTER TABLE "game_sheet_results" DROP CONSTRAINT "game_sheet_results_gameId_fkey";

-- DropForeignKey
ALTER TABLE "game_square_results" DROP CONSTRAINT "game_square_results_gameSheetId_fkey";

-- AddForeignKey
ALTER TABLE "game_sheet_results" ADD CONSTRAINT "game_sheet_results_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_square_results" ADD CONSTRAINT "game_square_results_gameSheetId_fkey" FOREIGN KEY ("gameSheetId") REFERENCES "game_sheet_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
