-- Eventdag: match bewust overslaan bij het ingeven van scores.
ALTER TABLE "Match" ADD COLUMN "skipped" BOOLEAN NOT NULL DEFAULT false;
