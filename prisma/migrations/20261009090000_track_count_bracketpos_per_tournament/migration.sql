-- Idempotent: op productie werd "trackCount" al met de hand toegevoegd.
-- Elke stap slaat over wat al bestaat en zet de kolom daarna exact goed.

-- Aantal banen per toernooi (de generators plannen hiermee).
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "trackCount" INTEGER;
ALTER TABLE "Tournament" ALTER COLUMN "trackCount" TYPE INTEGER USING "trackCount"::integer;
UPDATE "Tournament" SET "trackCount" = 6 WHERE "trackCount" IS NULL;
ALTER TABLE "Tournament" ALTER COLUMN "trackCount" SET DEFAULT 6;
ALTER TABLE "Tournament" ALTER COLUMN "trackCount" SET NOT NULL;

-- bracketPos was globaal uniek, waardoor "R32-1" maar in één toernooi kon
-- bestaan. Nu uniek per toernooi.
DROP INDEX IF EXISTS "Match_bracketPos_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Match_tournamentId_bracketPos_key" ON "Match"("tournamentId", "bracketPos");
