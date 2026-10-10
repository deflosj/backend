-- Instellingen voor het automatisch opgemaakte knock-outschema. IF NOT EXISTS: veilig bij handmatige wijzigingen.
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "knockoutPauseMinutes" INTEGER NOT NULL DEFAULT 15;
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "knockoutSlotMinutes" INTEGER;
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "finalsSlotMinutes" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "roundBreakMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "withConsolation" BOOLEAN NOT NULL DEFAULT true;
