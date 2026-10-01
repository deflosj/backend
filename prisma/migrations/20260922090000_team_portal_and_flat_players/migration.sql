-- Teamportaal: platte spelersvelden, balievelden en een portaaltoken per team.
-- De namen uit Player worden eerst overgezet, pas daarna verdwijnt die tabel.

-- 1. Tournament: deadline voor zelfbeheer door de teams
ALTER TABLE "Tournament" ADD COLUMN "teamEditDeadline" TIMESTAMP(3);

-- 2. Team: nieuwe velden
ALTER TABLE "Team" ADD COLUMN "isPaid"      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Team" ADD COLUMN "captainName" TEXT;
ALTER TABLE "Team" ADD COLUMN "email"       TEXT;
ALTER TABLE "Team" ADD COLUMN "speler1"     TEXT NOT NULL DEFAULT '';
ALTER TABLE "Team" ADD COLUMN "speler2"     TEXT NOT NULL DEFAULT '';
ALTER TABLE "Team" ADD COLUMN "speler3"     TEXT NOT NULL DEFAULT '';
ALTER TABLE "Team" ADD COLUMN "speler4"     TEXT NOT NULL DEFAULT '';
ALTER TABLE "Team" ADD COLUMN "token"       TEXT;

-- 3. Spelersnamen overzetten: kapitein eerst, daarna op id-volgorde
WITH ranked AS (
  SELECT "teamId",
         "name",
         "isCaptain",
         ROW_NUMBER() OVER (
           PARTITION BY "teamId"
           ORDER BY "isCaptain" DESC, "id" ASC
         ) AS rn
  FROM "Player"
)
UPDATE "Team" t SET
  "speler1"     = COALESCE((SELECT r."name" FROM ranked r WHERE r."teamId" = t."id" AND r.rn = 1), ''),
  "speler2"     = COALESCE((SELECT r."name" FROM ranked r WHERE r."teamId" = t."id" AND r.rn = 2), ''),
  "speler3"     = COALESCE((SELECT r."name" FROM ranked r WHERE r."teamId" = t."id" AND r.rn = 3), ''),
  "speler4"     = COALESCE((SELECT r."name" FROM ranked r WHERE r."teamId" = t."id" AND r.rn = 4), ''),
  "captainName" = (SELECT r."name" FROM ranked r WHERE r."teamId" = t."id" AND r."isCaptain" IS TRUE ORDER BY r.rn LIMIT 1);

-- 4. Elk bestaand team een token geven, daarna verplicht en uniek maken
UPDATE "Team"
SET "token" = md5(random()::text || clock_timestamp()::text || "id"::text)
WHERE "token" IS NULL;

ALTER TABLE "Team" ALTER COLUMN "token" SET NOT NULL;
CREATE UNIQUE INDEX "Team_token_key" ON "Team"("token");

-- 5. Player is niet langer nodig
DROP TABLE "Player";
