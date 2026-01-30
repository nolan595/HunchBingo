/*
  Warnings:

  - You are about to drop the column `createdAt` on the `OddsDifficulty` table. All the data in the column will be lost.
  - You are about to drop the column `minnOdd` on the `OddsDifficulty` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `OddsDifficulty` table. All the data in the column will be lost.
  - Added the required column `minOdd` to the `OddsDifficulty` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OddsDifficulty" DROP COLUMN "createdAt",
DROP COLUMN "minnOdd",
DROP COLUMN "updatedAt",
ADD COLUMN     "minOdd" DOUBLE PRECISION NOT NULL;
