-- CreateTable
CREATE TABLE "OddsDifficulty" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "minnOdd" DOUBLE PRECISION NOT NULL,
    "maxOdd" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OddsDifficulty_pkey" PRIMARY KEY ("id")
);
