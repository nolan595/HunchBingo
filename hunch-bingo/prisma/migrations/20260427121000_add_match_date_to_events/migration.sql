-- Add matchDate to external_events (nullable — existing rows will be null)
ALTER TABLE "external_events" ADD COLUMN "matchDate" TIMESTAMP(3);
