ALTER TABLE "Tournament"
  ADD COLUMN "rules" TEXT,
  ADD COLUMN "rulesUpdatedAt" TIMESTAMP(3);

UPDATE "Tournament" t
SET
  "rules" = r.description,
  "rulesUpdatedAt" = r."updatedAt"
FROM "TournamentRules" r
WHERE r."tournamentId" = t.id;

DROP TABLE "TournamentRules";
