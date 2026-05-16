-- CreateTable
CREATE TABLE "RegistrationSettings" (
    "id" INTEGER NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "dorpelingenkoersLimit" INTEGER,
    "funWedstrijdLimit" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationSettings_pkey" PRIMARY KEY ("id")
);
