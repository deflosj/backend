/**
 * Zet het wachtwoord van een gebruiker opnieuw en toont welke users er zijn.
 *
 *   DATABASE_URL="<prod-url>" npx ts-node scripts/reset-password.ts            -> lijst users
 *   DATABASE_URL="<prod-url>" npx ts-node scripts/reset-password.ts <email|username> <nieuw-wachtwoord>
 */
import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [identifier, newPassword] = process.argv.slice(2);
  const host = (process.env.DATABASE_URL ?? "").replace(/\/\/[^@]*@/, "//***@");
  console.log(`Databank: ${host}`);

  if (!identifier) {
    const users = await prisma.user.findMany({ select: { id: true, email: true, username: true, role: true, isActive: true } });
    console.table(users);
    return;
  }

  const user = await prisma.user.findFirst({ where: { OR: [{ email: identifier }, { username: identifier }] } });
  if (!user) throw new Error(`Geen gebruiker gevonden voor "${identifier}"`);
  if (!newPassword || newPassword.length < 8) throw new Error("Geef een nieuw wachtwoord van minstens 8 tekens op");

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await argon2.hash(newPassword), isActive: true },
  });
  console.log(`Wachtwoord aangepast voor ${user.username} (${user.email}), rol ${user.role}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
