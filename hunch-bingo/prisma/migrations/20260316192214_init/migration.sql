-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('DRAFT', 'PENDING', 'OPEN', 'CLOSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SquareStatus" AS ENUM ('PENDING', 'WON', 'LOST', 'NO_MATCH');

-- CreateTable
CREATE TABLE "odds_difficulties" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "oddsMin" DOUBLE PRECISION NOT NULL,
    "oddsMax" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "odds_difficulties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bingo_sheets" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bingo_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bingo_sheet_squares" (
    "id" SERIAL NOT NULL,
    "sheetId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "marketId" INTEGER NOT NULL,
    "difficultyId" INTEGER NOT NULL,

    CONSTRAINT "bingo_sheet_squares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_events" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'DRAFT',
    "openTime" TIMESTAMP(3) NOT NULL,
    "closeTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_sheet_results" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "sheetId" INTEGER NOT NULL,
    "connect3" BOOLEAN,
    "score" INTEGER,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "game_sheet_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_square_results" (
    "id" SERIAL NOT NULL,
    "gameSheetId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "marketId" INTEGER NOT NULL,
    "outcomeId" INTEGER,
    "outcomeName" TEXT,
    "capturedPrice" DOUBLE PRECISION,
    "status" "SquareStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "game_square_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "odds_difficulties_name_key" ON "odds_difficulties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "bingo_sheet_squares_sheetId_position_key" ON "bingo_sheet_squares"("sheetId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "external_events_externalEventId_key" ON "external_events"("externalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "game_sheet_results_gameId_sheetId_key" ON "game_sheet_results"("gameId", "sheetId");

-- AddForeignKey
ALTER TABLE "bingo_sheet_squares" ADD CONSTRAINT "bingo_sheet_squares_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "bingo_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bingo_sheet_squares" ADD CONSTRAINT "bingo_sheet_squares_difficultyId_fkey" FOREIGN KEY ("difficultyId") REFERENCES "odds_difficulties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "external_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sheet_results" ADD CONSTRAINT "game_sheet_results_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sheet_results" ADD CONSTRAINT "game_sheet_results_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "bingo_sheets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_square_results" ADD CONSTRAINT "game_square_results_gameSheetId_fkey" FOREIGN KEY ("gameSheetId") REFERENCES "game_sheet_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
