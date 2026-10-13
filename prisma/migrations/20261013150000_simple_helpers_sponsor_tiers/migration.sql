-- Sponsorcategorieën: Hoofdsponsor/Goud/Standaard → €450+/€450/€200.
-- RENAME VALUE behoudt de bestaande sponsors in hun categorie.
ALTER TYPE "SponsorTier" RENAME VALUE 'MAIN' TO 'T450_PLUS';
ALTER TYPE "SponsorTier" RENAME VALUE 'GOLD' TO 'T450';
ALTER TYPE "SponsorTier" RENAME VALUE 'STANDARD' TO 'T200';
ALTER TABLE "Sponsor" ALTER COLUMN "tier" SET DEFAULT 'T200';

-- Simpele helperlijst: een persoon + bij welke events die hielp (geen shifts).
CREATE TABLE "Helper" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Helper_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_EventToHelper" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_EventToHelper_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX "_EventToHelper_B_index" ON "_EventToHelper"("B");

ALTER TABLE "_EventToHelper" ADD CONSTRAINT "_EventToHelper_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_EventToHelper" ADD CONSTRAINT "_EventToHelper_B_fkey" FOREIGN KEY ("B") REFERENCES "Helper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
