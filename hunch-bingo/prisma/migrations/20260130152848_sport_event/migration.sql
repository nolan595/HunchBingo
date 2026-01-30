-- CreateTable
CREATE TABLE "SportEvent" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "externalId" INTEGER NOT NULL,

    CONSTRAINT "SportEvent_pkey" PRIMARY KEY ("id")
);
