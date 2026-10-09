/**
 * Importeert ploegen uit een csv-export van de tabel Team in een toernooi.
 * Enkel de ploegen: poules en wedstrijden maak je daarna via de admin.
 *
 *   npx ts-node scripts/import-teams.ts data/teams-2026.csv
 *   npx ts-node scripts/import-teams.ts data/teams-2026.csv --jaar=2026 --naam="Petanque Tornooi" --bron=3
 *
 * - --bron   welk tournamentId uit de csv (standaard: het hoogste)
 * - --jaar / --naam   het doeltoernooi; bestaat het niet, dan wordt het aangemaakt
 *   (4 per poule, top 2 + 8 beste derdes, 6 banen)
 * - Een ploeg met dezelfde naam in het doeltoernooi wordt bijgewerkt, niet
 *   dubbel aangemaakt. Opnieuw draaien kan dus gerust.
 * - Portaaltokens uit de csv blijven behouden (links blijven werken), tenzij
 *   die token lokaal al bij een andere ploeg hoort.
 * - Draait enkel op een lokale databank, tenzij je --forceer meegeeft.
 */
import { randomBytes } from "crypto";
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Kleine csv-parser: dubbele aanhalingstekens, komma's en "" binnen velden. */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(name.length + 3);
}

async function main() {
  const file = process.argv[2];
  if (!file || file.startsWith("--")) {
    console.error("Gebruik: npx ts-node scripts/import-teams.ts <bestand.csv> [--jaar=2026] [--naam=...] [--bron=3]");
    process.exit(1);
  }

  const url = process.env.DATABASE_URL ?? "";
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  console.log(`Databank: ${url.replace(/\/\/[^@]*@/, "//***@")}`);
  if (!local && !process.argv.includes("--forceer")) {
    console.error("Dit is geen lokale databank. Voeg --forceer toe als je dit echt wil.");
    process.exit(1);
  }

  const rows = parseCsv(readFileSync(file, "utf8"));
  const sources = [...new Set(rows.map((r) => Number(r.tournamentId)).filter(Boolean))].sort((a, b) => a - b);
  const bron = Number(arg("bron") ?? sources.at(-1));
  const teams = rows.filter((r) => Number(r.tournamentId) === bron && r.name);
  console.log(`csv: ${rows.length} rijen, toernooien ${sources.join(", ")}; importeer ${teams.length} ploegen uit toernooi ${bron}`);

  const year = Number(arg("jaar") ?? new Date().getFullYear());
  const name = arg("naam") ?? "Petanque Tornooi";
  let tournament = await prisma.tournament.findFirst({ where: { year, name } });
  if (!tournament) {
    tournament = await prisma.tournament.create({
      data: { name, year, teamsPerPoule: 4, teamsAdvancingPerPoule: 2, bestNthsAdvancing: 8, trackCount: 6 },
    });
    console.log(`Toernooi aangemaakt: ${name} ${year} (id ${tournament.id})`);
  } else {
    console.log(`Toernooi gevonden: ${name} ${year} (id ${tournament.id})`);
  }

  let created = 0;
  let updated = 0;
  for (const r of teams) {
    const method = r.paymentMethod?.toUpperCase();
    const data = {
      name: r.name,
      captainName: r.captainName || null,
      email: r.email || null,
      phone: r.phone || null,
      speler1: r.speler1 ?? "",
      speler2: r.speler2 ?? "",
      speler3: r.speler3 ?? "",
      speler4: r.speler4 ?? "",
      isPaid: r.isPaid === "true",
      paymentMethod: method === "CASH" || method === "PAYCONIQ" ? method : null,
      isPresent: r.isPresent === "true",
    };

    const existing = await prisma.team.findFirst({ where: { tournamentId: tournament.id, name: r.name } });
    if (existing) {
      await prisma.team.update({ where: { id: existing.id }, data });
      updated++;
      continue;
    }
    const tokenTaken = r.token ? await prisma.team.findUnique({ where: { token: r.token } }) : null;
    const token = r.token && !tokenTaken ? r.token : randomBytes(16).toString("hex");
    await prisma.team.create({ data: { ...data, tournamentId: tournament.id, pouleId: null, token } });
    created++;
  }

  const total = await prisma.team.count({ where: { tournamentId: tournament.id } });
  console.log(`Klaar: ${created} nieuw, ${updated} bijgewerkt. Het toernooi telt nu ${total} ploegen (zonder poule).`);
}

main()
  .catch((e) => {
    console.error("Import mislukt:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
