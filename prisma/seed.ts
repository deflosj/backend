import { PrismaClient, UserRole, SponsorTier, MsgStatus, Phase } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱  Seeding database…");

  // ── Users ──────────────────────────────────────────────────────────────────

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@deflosj.be" },
    update: {},
    create: {
      email: "admin@deflosj.be",
      username: "admin",
      password: passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const captain1 = await prisma.user.upsert({
    where: { email: "luca.janssen@deflosj.be" },
    update: {},
    create: {
      email: "luca.janssen@deflosj.be",
      username: "luca.janssen",
      password: passwordHash,
      role: UserRole.CAPTAIN,
      isActive: true,
    },
  });

  const captain2 = await prisma.user.upsert({
    where: { email: "nina.declercq@deflosj.be" },
    update: {},
    create: {
      email: "nina.declercq@deflosj.be",
      username: "nina.declercq",
      password: passwordHash,
      role: UserRole.CAPTAIN,
      isActive: true,
    },
  });

  const member1 = await prisma.user.upsert({
    where: { email: "thomas.vermeersch@deflosj.be" },
    update: {},
    create: {
      email: "thomas.vermeersch@deflosj.be",
      username: "thomas.vermeersch",
      password: passwordHash,
      role: UserRole.MEMBER,
      isActive: true,
    },
  });

  const member2 = await prisma.user.upsert({
    where: { email: "elien.devos@deflosj.be" },
    update: {},
    create: {
      email: "elien.devos@deflosj.be",
      username: "elien.devos",
      password: passwordHash,
      role: UserRole.MEMBER,
      isActive: true,
    },
  });

  const member3 = await prisma.user.upsert({
    where: { email: "bram.pieters@deflosj.be" },
    update: {},
    create: {
      email: "bram.pieters@deflosj.be",
      username: "bram.pieters",
      password: passwordHash,
      role: UserRole.MEMBER,
      isActive: true,
    },
  });

  console.log("  ✔  Users");

  // ── Member profiles ────────────────────────────────────────────────────────

  await prisma.memberProfile.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      firstName: "Admin",
      lastName: "De Flosj",
      bio: "Verantwoordelijk voor het beheer van de vereniging.",
      joinedAt: new Date("2020-01-01"),
      isPublic: false,
    },
  });

  await prisma.memberProfile.upsert({
    where: { userId: captain1.id },
    update: {},
    create: {
      userId: captain1.id,
      firstName: "Luca",
      lastName: "Janssen",
      phone: "+32 475 11 22 33",
      bio: "Aanvoerder van team De Vlaamse Arend. Al meer dan 5 jaar actief bij De Flosj.",
      joinedAt: new Date("2019-03-15"),
      isPublic: true,
    },
  });

  await prisma.memberProfile.upsert({
    where: { userId: captain2.id },
    update: {},
    create: {
      userId: captain2.id,
      firstName: "Nina",
      lastName: "Declercq",
      phone: "+32 476 44 55 66",
      bio: "Kapitein van team De Witte Molen. Enthousiast lid en drijvende kracht.",
      joinedAt: new Date("2020-06-01"),
      isPublic: true,
    },
  });

  await prisma.memberProfile.upsert({
    where: { userId: member1.id },
    update: {},
    create: {
      userId: member1.id,
      firstName: "Thomas",
      lastName: "Vermeersch",
      bio: "Vast gezicht op elk evenement van De Flosj.",
      joinedAt: new Date("2021-09-10"),
      isPublic: true,
    },
  });

  await prisma.memberProfile.upsert({
    where: { userId: member2.id },
    update: {},
    create: {
      userId: member2.id,
      firstName: "Elien",
      lastName: "Devos",
      phone: "+32 478 77 88 99",
      joinedAt: new Date("2022-01-20"),
      isPublic: true,
    },
  });

  await prisma.memberProfile.upsert({
    where: { userId: member3.id },
    update: {},
    create: {
      userId: member3.id,
      firstName: "Bram",
      lastName: "Pieters",
      bio: "Nieuwste aanwinst van de vereniging. Vol enthousiasme!",
      joinedAt: new Date("2023-04-05"),
      isPublic: true,
    },
  });

  console.log("  ✔  Member profiles");

  // ── News posts ─────────────────────────────────────────────────────────────

  await prisma.newsPost.upsert({
    where: { slug: "seizoensstart-2025" },
    update: {},
    create: {
      authorId: admin.id,
      title: "Seizoensstart 2025 — De Flosj is er klaar voor!",
      slug: "seizoensstart-2025",
      body: `Na een geslaagde winterpauze trapt De Flosj het nieuwe seizoen af met een vernieuwde ploeg en een heleboel ambitie.

Het bestuur heeft hard gewerkt aan de organisatie van dit jaar en we mogen jullie al verklappen dat er heel wat te beleven valt: een nieuw toernooi, de jaarlijkse dorpelingenkoers en tal van sociale activiteiten voor jong en oud.

Schrijf alvast de data in je agenda en volg onze website voor de laatste nieuwtjes. We kijken ernaar uit jullie te verwelkomen!`,
      publishedAt: new Date("2025-01-15T10:00:00"),
    },
  });

  await prisma.newsPost.upsert({
    where: { slug: "inschrijvingen-toernooi-2025-open" },
    update: {},
    create: {
      authorId: admin.id,
      title: "Inschrijvingen toernooi 2025 zijn geopend",
      slug: "inschrijvingen-toernooi-2025-open",
      body: `Vanaf vandaag kunnen teams zich inschrijven voor het jaarlijkse De Flosj Toernooi. Dit jaar verwachten we meer dan 16 deelnemende ploegen uit de Vlaamse Ardennen en omstreken.

De inschrijving verloopt via het beheersplatform of door rechtstreeks contact op te nemen met de organisatie. Elke ploeg bestaat uit minstens 4 spelers en 1 kapitein.

Wees er snel bij — het aantal plaatsen is beperkt! De deadline voor inschrijving is 15 mei 2025.`,
      publishedAt: new Date("2025-02-01T09:00:00"),
    },
  });

  await prisma.newsPost.upsert({
    where: { slug: "nieuwe-sponsor-bakkerij-van-acker" },
    update: {},
    create: {
      authorId: admin.id,
      title: "Welkom bij onze nieuwe sponsor: Bakkerij Van Acker",
      slug: "nieuwe-sponsor-bakkerij-van-acker",
      body: `De Flosj verwelkomt met trots Bakkerij Van Acker als nieuwe sponsor voor het seizoen 2025.

Bakkerij Van Acker is al meer dan 30 jaar een vertrouwde naam in de streek en steunt onze vereniging met hart en ziel. We zijn hen ontzettend dankbaar voor deze samenwerking.

Bezoek zeker hun winkel in het dorpscentrum en geniet van hun ambachtelijke producten!`,
      publishedAt: new Date("2025-03-10T11:00:00"),
    },
  });

  await prisma.newsPost.upsert({
    where: { slug: "terugblik-dorpelingenkoers-2024" },
    update: {},
    create: {
      authorId: admin.id,
      title: "Terugblik op de Dorpelingenkoers 2024",
      slug: "terugblik-dorpelingenkoers-2024",
      body: `De Dorpelingenkoers van 2024 was opnieuw een groot succes! Met meer dan 120 deelnemers en honderden toeschouwers langs het parcours was het een onvergetelijke dag.

De winst ging naar Jan Desmet uit Brakel, die in de finale sprint zijn concurrenten nipt voor bleef. Proficiat Jan!

We bedanken alle vrijwilligers, sponsors en deelnemers die dit evenement elk jaar opnieuw tot een succes maken. Tot volgend jaar!`,
      publishedAt: new Date("2024-09-20T14:00:00"),
    },
  });

  await prisma.newsPost.upsert({
    where: { slug: "update-reglement-toernooi-2025" },
    update: {},
    create: {
      authorId: admin.id,
      title: "Update toernooireglement 2025 — concept",
      slug: "update-reglement-toernooi-2025",
      body: `Dit artikel is nog niet gepubliceerd. Het bevat de conceptversie van het toernooireglement voor 2025 die nog goedgekeurd moet worden door het bestuur.

Wijzigingen ten opzichte van vorig jaar:
- Nieuwe pouletabel met 4 groepen van 4 teams
- Knock-outfase vanaf de kwartfinales
- Tiebreak-regels herzien`,
      publishedAt: null,
    },
  });

  console.log("  ✔  News posts");

  // ── Events ─────────────────────────────────────────────────────────────────

  await prisma.event.upsert({
    where: { id: 1 },
    update: {},
    create: {
      createdById: admin.id,
      title: "De Flosj Toernooi 2025",
      description: "Het jaarlijkse De Flosj voetbaltoernooi voor ploegen uit de Vlaamse Ardennen. Teams van 4 veldspelers + keeper. Inschrijven vereist.",
      location: "Sporthal De Klaverkouter, Brakel",
      startsAt: new Date("2025-06-21T09:00:00"),
      endsAt: new Date("2025-06-21T18:00:00"),
      isPublished: true,
    },
  });

  await prisma.event.upsert({
    where: { id: 2 },
    update: {},
    create: {
      createdById: admin.id,
      title: "Dorpelingenkoers 2025",
      description: "De jaarlijkse wielerwedstrijd voor dorpelingen. Open voor alle leeftijdscategorieën. Inschrijving aan de start.",
      location: "Marktplein, Brakel",
      startsAt: new Date("2025-09-14T10:00:00"),
      endsAt: new Date("2025-09-14T16:00:00"),
      isPublished: true,
    },
  });

  await prisma.event.upsert({
    where: { id: 3 },
    update: {},
    create: {
      createdById: admin.id,
      title: "Barbecue voor leden",
      description: "Jaarlijkse barbecue voor leden en hun families. Gratis voor leden, kleine bijdrage voor niet-leden.",
      location: "Verenigingslokaal De Flosj",
      startsAt: new Date("2025-07-12T17:00:00"),
      endsAt: new Date("2025-07-12T22:00:00"),
      isPublished: true,
    },
  });

  await prisma.event.upsert({
    where: { id: 4 },
    update: {},
    create: {
      createdById: admin.id,
      title: "Algemene vergadering 2025",
      description: "Jaarlijkse algemene vergadering van De Flosj. Agenda: jaarverslag, financiën, plannen 2026. Aanwezigheid verplicht voor bestuursleden.",
      location: "Café 't Centrum, Brakel",
      startsAt: new Date("2025-11-08T19:30:00"),
      endsAt: new Date("2025-11-08T21:30:00"),
      isPublished: false,
    },
  });

  console.log("  ✔  Events");

  // ── Sponsors ───────────────────────────────────────────────────────────────

  const sponsorsData = [
    {
      name: "Brouwerij De Kroon",
      tier: SponsorTier.MAIN,
      websiteUrl: "https://www.brouwerijdekroon.be",
      isActive: true,
      sortOrder: 1,
    },
    {
      name: "Bakkerij Van Acker",
      tier: SponsorTier.GOLD,
      websiteUrl: null,
      isActive: true,
      sortOrder: 2,
    },
    {
      name: "Garage Declercq",
      tier: SponsorTier.GOLD,
      websiteUrl: null,
      isActive: true,
      sortOrder: 3,
    },
    {
      name: "Frituur De Hoek",
      tier: SponsorTier.STANDARD,
      websiteUrl: null,
      isActive: true,
      sortOrder: 4,
    },
    {
      name: "Tuinaanleg Pieters",
      tier: SponsorTier.STANDARD,
      websiteUrl: null,
      isActive: true,
      sortOrder: 5,
    },
    {
      name: "Apotheek Vandenberghe",
      tier: SponsorTier.STANDARD,
      websiteUrl: null,
      isActive: true,
      sortOrder: 6,
    },
    {
      name: "Immokantoor Centrum",
      tier: SponsorTier.STANDARD,
      websiteUrl: null,
      isActive: false,
      sortOrder: 7,
    },
  ];

  for (const s of sponsorsData) {
    const existing = await prisma.sponsor.findFirst({ where: { name: s.name } });
    if (!existing) {
      await prisma.sponsor.create({ data: s });
    }
  }

  console.log("  ✔  Sponsors");

  // ── Contact messages ───────────────────────────────────────────────────────

  const messagesData = [
    {
      name: "Pieter Coussement",
      email: "pieter.coussement@gmail.com",
      subject: "Vraag over inschrijving toernooi",
      body: "Goedendag,\n\nIk zou graag meer informatie willen over de inschrijvingsprocedure voor het toernooi. Kan een ploeg van buiten de gemeente ook deelnemen?\n\nMet vriendelijke groeten,\nPieter",
      status: MsgStatus.UNREAD,
      createdAt: new Date("2025-04-10T09:32:00"),
    },
    {
      name: "Sofie Maes",
      email: "sofie.maes@hotmail.com",
      subject: "Sponsoring voorstel",
      body: "Beste,\n\nIk ben zaakvoerster van een lokale bakkerij en zou graag sponsor worden van De Flosj. Kunt u mij meer informatie bezorgen over de sponsorpakketten?\n\nGroeten,\nSofie Maes",
      status: MsgStatus.READ,
      createdAt: new Date("2025-04-08T14:15:00"),
      readAt: new Date("2025-04-09T10:00:00"),
    },
    {
      name: "Kevin Vandaele",
      email: "k.vandaele@telenet.be",
      subject: null,
      body: "Hallo, wanneer start de inschrijving voor de dorpelingenkoers? En kan ik me online inschrijven? Bedankt.",
      status: MsgStatus.UNREAD,
      createdAt: new Date("2025-04-12T17:48:00"),
    },
    {
      name: "Marie-Claire Bogaert",
      email: "mc.bogaert@gmail.com",
      subject: "Felicitaties",
      body: "Beste organisatie,\n\nIk wilde jullie even feliciteren met het geweldige werk dat jullie doen voor de gemeenschap. De Flosj is een echte aanwinst voor ons dorp!\n\nVeel succes dit jaar,\nMarie-Claire",
      status: MsgStatus.ARCHIVED,
      createdAt: new Date("2025-03-25T11:20:00"),
      readAt: new Date("2025-03-25T15:00:00"),
    },
  ];

  for (const m of messagesData) {
    const existing = await prisma.contactMessage.findFirst({ where: { email: m.email, subject: m.subject } });
    if (!existing) {
      await prisma.contactMessage.create({ data: m });
    }
  }

  console.log("  ✔  Contact messages");

  // ── Tournament ─────────────────────────────────────────────────────────────

  const tournament = await prisma.tournament.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "De Flosj Toernooi 2025",
      year: 2025,
      isActive: true,
    },
  });

  await prisma.tournamentRules.upsert({
    where: { tournamentId: tournament.id },
    update: {},
    create: {
      tournamentId: tournament.id,
      description: `Reglement De Flosj Toernooi 2025

1. Elke ploeg bestaat uit 4 veldspelers en 1 keeper (5 spelers totaal).
2. De groepsfase wordt gespeeld in pouletjes van 4 ploegen (round-robin).
3. Puntentelling: 3 punten voor een overwinning, 1 punt gelijkspel, 0 voor verlies.
4. Bij gelijke punten telt het doelsaldo, daarna de meeste doelpunten, daarna een tiebreak.
5. De twee beste ploegen per poule gaan door naar de knock-outfase.
6. Matchen in de knock-outfase: 2 × 8 minuten. Bij gelijkstand: penalty's.
7. Spelers moeten ingeschreven zijn bij hun ploeg voor aanvang van het toernooi.
8. Eerlijk en sportief spel is verplicht. Rood kaart = uitsluiting voor de rest van het toernooi.`,
    },
  });

  const pouleA = await prisma.poule.upsert({
    where: { id: 1 },
    update: {},
    create: {
      tournamentId: tournament.id,
      name: "Poule A",
      phase: Phase.GROUP,
    },
  });

  const pouleB = await prisma.poule.upsert({
    where: { id: 2 },
    update: {},
    create: {
      tournamentId: tournament.id,
      name: "Poule B",
      phase: Phase.GROUP,
    },
  });

  const teamsData = [
    // Poule A
    { id: 1, name: "De Vlaamse Arend",  captainId: captain1.id, pouleId: pouleA.id, captainName: "Luca Janssen",     speler1: "Luca Janssen",      speler2: "Tom Declercq",        speler3: "Wout Pieters",        speler4: "Jens Bogaert" },
    { id: 2, name: "De Witte Molen",    captainId: captain2.id, pouleId: pouleA.id, captainName: "Nina Declercq",    speler1: "Nina Declercq",     speler2: "Hanne Devos",         speler3: "Lisa Maes",           speler4: "Sara Coussement" },
    { id: 3, name: "FC De Klaver",      captainId: null,        pouleId: pouleA.id, captainName: "Kobe Vermeersch",  speler1: "Kobe Vermeersch",   speler2: "Sander Janssens",     speler3: "Ruben De Wolf",       speler4: "Tibo Claeys" },
    { id: 4, name: "Den Djoef",         captainId: null,        pouleId: pouleA.id, captainName: "Mathis Peeters",   speler1: "Mathis Peeters",    speler2: "Arnaud Willems",      speler3: "Baptiste Leclercq",   speler4: "Sébastien Dubois" },
    // Poule B
    { id: 5, name: "De Ronse Boys",     captainId: null,        pouleId: pouleB.id, captainName: "Stef Vandenberghe", speler1: "Stef Vandenberghe", speler2: "Niels Claes",        speler3: "Dieter Bonte",        speler4: "Glenn Hoste" },
    { id: 6, name: "Gezelle FC",        captainId: null,        pouleId: pouleB.id, captainName: "Bavo Geerts",      speler1: "Bavo Geerts",       speler2: "Lennart Nijs",        speler3: "Florian Baert",       speler4: "Matteo Vanden Berghe" },
    { id: 7, name: "De Kattekoppen",    captainId: null,        pouleId: pouleB.id, captainName: "Joren Desmet",     speler1: "Joren Desmet",      speler2: "Bert Lambrecht",      speler3: "Nico Goossens",       speler4: "Axel Raes" },
    { id: 8, name: "Flandria United",   captainId: null,        pouleId: pouleB.id, captainName: "Quinten Mertens",  speler1: "Quinten Mertens",   speler2: "Remi Stevens",        speler3: "Lukas Cools",         speler4: "Nathan Wouters" },
  ];

  for (const t of teamsData) {
    await prisma.team.upsert({
      where: { id: t.id },
      update: {},
      create: {
        tournamentId: tournament.id,
        captainId: t.captainId,
        pouleId: t.pouleId,
        name: t.name,
        captainName: t.captainName,
        speler1: t.speler1,
        speler2: t.speler2,
        speler3: t.speler3,
        speler4: t.speler4,
      },
    });
  }

  console.log("  ✔  Tournament, poules & teams");

  // ── Matches ────────────────────────────────────────────────────────────────
  //
  // Groepsfase Poule A (round-robin, 6 matchen)
  //
  //  1 vs 2 : De Vlaamse Arend  3–1  De Witte Molen    → winnaar: 1
  //  3 vs 4 : FC De Klaver      2–2  Den Djoef          → gelijkspel
  //  1 vs 3 : De Vlaamse Arend  2–0  FC De Klaver       → winnaar: 1
  //  2 vs 4 : De Witte Molen    1–0  Den Djoef          → winnaar: 2
  //  1 vs 4 : De Vlaamse Arend  4–1  Den Djoef          → winnaar: 1
  //  2 vs 3 : De Witte Molen    1–2  FC De Klaver       → winnaar: 3
  //
  // Eindstand Poule A:  1. De Vlaamse Arend 9pts  2. FC De Klaver 4pts
  //                     3. De Witte Molen 3pts    4. Den Djoef 1pt
  //
  // Groepsfase Poule B (round-robin, 6 matchen)
  //
  //  5 vs 6 : De Ronse Boys     0–1  Gezelle FC         → winnaar: 6
  //  7 vs 8 : De Kattekoppen    3–2  Flandria United    → winnaar: 7
  //  5 vs 7 : De Ronse Boys     1–1  De Kattekoppen     → gelijkspel
  //  6 vs 8 : Gezelle FC        2–0  Flandria United    → winnaar: 6
  //  5 vs 8 : De Ronse Boys     2–1  Flandria United    → winnaar: 5
  //  6 vs 7 : Gezelle FC        1–2  De Kattekoppen     → winnaar: 7
  //
  // Eindstand Poule B:  1. De Kattekoppen 7pts  2. Gezelle FC 6pts
  //                     3. De Ronse Boys 4pts   4. Flandria United 0pts
  //
  // Knock-out:
  //  SF1: De Vlaamse Arend (A1) vs Gezelle FC (B2)   → 3–1  winnaar: 1
  //  SF2: De Kattekoppen (B1)   vs FC De Klaver (A2) → 2–0  winnaar: 7
  //  Troostfinale: Gezelle FC vs FC De Klaver         → 1–0  winnaar: 6
  //  Finale: De Vlaamse Arend vs De Kattekoppen       → 2–1  winnaar: 1

  const today = new Date("2025-06-21");
  const t_ = (h: number, m: number): Date => new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m);

  const matchesData = [
    // Poule A
    { id:  1, pouleId: pouleA.id, teamAId: 1, teamBId: 2, scoreA: 3, scoreB: 1, winnerId: 1,    time: t_(9,  0),  track: 1, phase: Phase.GROUP,              bracketPos: null  },
    { id:  2, pouleId: pouleA.id, teamAId: 3, teamBId: 4, scoreA: 2, scoreB: 2, winnerId: null, time: t_(9,  0),  track: 2, phase: Phase.GROUP,              bracketPos: null  },
    { id:  3, pouleId: pouleA.id, teamAId: 1, teamBId: 3, scoreA: 2, scoreB: 0, winnerId: 1,    time: t_(9, 25),  track: 1, phase: Phase.GROUP,              bracketPos: null  },
    { id:  4, pouleId: pouleA.id, teamAId: 2, teamBId: 4, scoreA: 1, scoreB: 0, winnerId: 2,    time: t_(9, 25),  track: 2, phase: Phase.GROUP,              bracketPos: null  },
    { id:  5, pouleId: pouleA.id, teamAId: 1, teamBId: 4, scoreA: 4, scoreB: 1, winnerId: 1,    time: t_(9, 50),  track: 1, phase: Phase.GROUP,              bracketPos: null  },
    { id:  6, pouleId: pouleA.id, teamAId: 2, teamBId: 3, scoreA: 1, scoreB: 2, winnerId: 3,    time: t_(9, 50),  track: 2, phase: Phase.GROUP,              bracketPos: null  },
    // Poule B
    { id:  7, pouleId: pouleB.id, teamAId: 5, teamBId: 6, scoreA: 0, scoreB: 1, winnerId: 6,    time: t_(9,  0),  track: 3, phase: Phase.GROUP,              bracketPos: null  },
    { id:  8, pouleId: pouleB.id, teamAId: 7, teamBId: 8, scoreA: 3, scoreB: 2, winnerId: 7,    time: t_(9,  0),  track: 4, phase: Phase.GROUP,              bracketPos: null  },
    { id:  9, pouleId: pouleB.id, teamAId: 5, teamBId: 7, scoreA: 1, scoreB: 1, winnerId: null, time: t_(9, 25),  track: 3, phase: Phase.GROUP,              bracketPos: null  },
    { id: 10, pouleId: pouleB.id, teamAId: 6, teamBId: 8, scoreA: 2, scoreB: 0, winnerId: 6,    time: t_(9, 25),  track: 4, phase: Phase.GROUP,              bracketPos: null  },
    { id: 11, pouleId: pouleB.id, teamAId: 5, teamBId: 8, scoreA: 2, scoreB: 1, winnerId: 5,    time: t_(9, 50),  track: 3, phase: Phase.GROUP,              bracketPos: null  },
    { id: 12, pouleId: pouleB.id, teamAId: 6, teamBId: 7, scoreA: 1, scoreB: 2, winnerId: 7,    time: t_(9, 50),  track: 4, phase: Phase.GROUP,              bracketPos: null  },
    // Halve finales
    { id: 13, pouleId: null,      teamAId: 1, teamBId: 6, scoreA: 3, scoreB: 1, winnerId: 1,    time: t_(11,  0), track: 1, phase: Phase.SEMI,               bracketPos: "SF1" },
    { id: 14, pouleId: null,      teamAId: 7, teamBId: 3, scoreA: 2, scoreB: 0, winnerId: 7,    time: t_(11,  0), track: 2, phase: Phase.SEMI,               bracketPos: "SF2" },
    // Troostfinale
    { id: 15, pouleId: null,      teamAId: 6, teamBId: 3, scoreA: 1, scoreB: 0, winnerId: 6,    time: t_(13,  0), track: 1, phase: Phase.CONSOLATION_FINAL,  bracketPos: "CF1" },
    // Finale
    { id: 16, pouleId: null,      teamAId: 1, teamBId: 7, scoreA: 2, scoreB: 1, winnerId: 1,    time: t_(14,  0), track: 1, phase: Phase.FINAL,              bracketPos: "F1"  },
  ];

  for (const m of matchesData) {
    await prisma.match.upsert({
      where: { id: m.id },
      update: {},
      create: {
        tournamentId: tournament.id,
        pouleId:   m.pouleId,
        teamAId:   m.teamAId,
        teamBId:   m.teamBId,
        scoreA:    m.scoreA,
        scoreB:    m.scoreB,
        winnerId:  m.winnerId,
        time:      m.time,
        track:     m.track,
        phase:     m.phase,
        bracketPos: m.bracketPos,
      },
    });
  }

  console.log("  ✔  Matches");

  // ── Team standings (groepsfase) ────────────────────────────────────────────
  //
  // Berekend op basis van de 3 groepswedstrijden per team.
  // Knock-out matchen worden niet meegeteld in de standing.

  const standings = [
    // id  played won drawn lost  gf  ga  saldo pts
    {  id: 1, played: 3, won: 3, drawn: 0, lost: 0, goalsFor:  9, goalsAgainst: 2, saldo:  7, points: 9 },
    {  id: 2, played: 3, won: 1, drawn: 0, lost: 2, goalsFor:  3, goalsAgainst: 5, saldo: -2, points: 3 },
    {  id: 3, played: 3, won: 1, drawn: 1, lost: 1, goalsFor:  4, goalsAgainst: 5, saldo: -1, points: 4 },
    {  id: 4, played: 3, won: 0, drawn: 1, lost: 2, goalsFor:  3, goalsAgainst: 7, saldo: -4, points: 1 },
    {  id: 5, played: 3, won: 1, drawn: 1, lost: 1, goalsFor:  3, goalsAgainst: 3, saldo:  0, points: 4 },
    {  id: 6, played: 3, won: 2, drawn: 0, lost: 1, goalsFor:  4, goalsAgainst: 2, saldo:  2, points: 6 },
    {  id: 7, played: 3, won: 2, drawn: 1, lost: 0, goalsFor:  6, goalsAgainst: 4, saldo:  2, points: 7 },
    {  id: 8, played: 3, won: 0, drawn: 0, lost: 3, goalsFor:  3, goalsAgainst: 7, saldo: -4, points: 0 },
  ];

  for (const s of standings) {
    await prisma.team.update({
      where: { id: s.id },
      data: {
        played:       s.played,
        won:          s.won,
        drawn:        s.drawn,
        lost:         s.lost,
        goalsFor:     s.goalsFor,
        goalsAgainst: s.goalsAgainst,
        saldo:        s.saldo,
        points:       s.points,
        isPresent:    true,
      },
    });
  }

  console.log("  ✔  Team standings");

  console.log("\n✅  Seed voltooid!");
  console.log("\n   Admin login:");
  console.log("   E-mail:    admin@deflosj.be");
  console.log("   Wachtwoord: Password123!\n");
}

main()
  .catch((e) => {
    console.error("❌  Seed mislukt:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
