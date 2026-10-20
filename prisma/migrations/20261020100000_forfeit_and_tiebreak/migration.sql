-- Forfait per wedstrijd (art. 20) en bal gooien bij gelijke stand (art. 9.5).
ALTER TABLE "Team" ADD COLUMN "pouleTiebreak" INTEGER;
ALTER TABLE "Team" ADD COLUMN "rankingTiebreak" INTEGER;
ALTER TABLE "Match" ADD COLUMN "forfeitTeamId" INTEGER;
ALTER TABLE "Match" ADD COLUMN "forfeitAuto" BOOLEAN NOT NULL DEFAULT false;
