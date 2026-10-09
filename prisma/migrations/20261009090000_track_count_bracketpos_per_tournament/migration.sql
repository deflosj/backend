-- Aantal banen per toernooi (de generators plannen hiermee).
ALTER TABLE "Tournament" ADD COLUMN "trackCount" INTEGER NOT NULL DEFAULT 6;

-- bracketPos was globaal uniek, waardoor "R32-1" maar in één toernooi kon
-- bestaan. Nu uniek per toernooi.
DROP INDEX "Match_bracketPos_key";
CREATE UNIQUE INDEX "Match_tournamentId_bracketPos_key" ON "Match"("tournamentId", "bracketPos");
