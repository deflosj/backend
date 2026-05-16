-- CreateEnum
CREATE TYPE "RaceCategory" AS ENUM ('DORPELINGENKOERS', 'FUN_WEDSTRIJD');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Registration" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TEXT,
    "gender" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "nationalRegisterNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "wielerclub" TEXT,
    "raceCategory" "RaceCategory" NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);
