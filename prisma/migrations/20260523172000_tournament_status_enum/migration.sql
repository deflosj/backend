-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- AlterTable: drop default, cast column to enum, restore default
ALTER TABLE "Tournament" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Tournament"
  ALTER COLUMN "status" TYPE "TournamentStatus"
    USING "status"::"TournamentStatus";
ALTER TABLE "Tournament" ALTER COLUMN "status" SET DEFAULT 'UPCOMING'::"TournamentStatus";
