/* eslint-disable no-console */
import { PrismaClient, UserRole, SponsorTier, MsgStatus, Phase, RaceCategory, RegistrationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("🌱  Seeding database…");

  // ── Users ──────────────────────────────────────────────────────────────────

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const wannes = await prisma.user.upsert({
    where: { email: "wannes.persyn@gmail.com" },
    update: {},
    create: {
      email: "wannes.persyn@gmail.com",
      username: "wannes_persyn",
      password: passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const arne = await prisma.user.upsert({
    where: { email: "arne.vandepoel@gmail.com" },
    update: {},
    create: {
      email: "arne.vandepoel@gmail.com",
      username: "arne_vandepoel",
      password: passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const gert = await prisma.user.upsert({
    where: { email: "gert.verbiern@gmail.com" },
    update: {},
    create: {
      email: "gert.verbiern@gmail.com",
      username: "gert_verbiern",
      password: passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const jannes = await prisma.user.upsert({
    where: { email: "jannes.devesse@gmail.com" },
    update: {},
    create: {
      email: "jannes.devesse@gmail.com",
      username: "jannes_devesse",
      password: passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const joppe = await prisma.user.upsert({
    where: { email: "joppe.vanloye@gmail.com" },
    update: {},
    create: {
      email: "joppe.vanloye@gmail.com",
      username: "joppe_vanloye",
      password: passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const liselot = await prisma.user.upsert({
    where: { email: "liselot.persyn@gmail.com" },
    update: {},
    create: {
      email: "liselot.persyn@gmail.com",
      username: "liselot_persyn",
      password: passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const michiel = await prisma.user.upsert({
    where: { email: "michiel.janssens@gmail.com" },
    update: {},
    create: {
      email: "michiel.janssens@gmail.com",
      username: "michiel_janssens",
      password: passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const pieter = await prisma.user.upsert({
    where: { email: "pieter.david@gmail.com" },
    update: {},
    create: {
      email: "pieter.david@gmail.com",
      username: "pieter_david",
      password: passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const roel = await prisma.user.upsert({
    where: { email: "roel.debecker@gmail.com" },
    update: {},
    create: {
      email: "roel.debecker@gmail.com",
      username: "roel_debecker",
      password: passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log("  ✔  Users");

  // ── Member profiles ────────────────────────────────────────────────────────

  await prisma.memberProfile.upsert({
    where: { userId: wannes.id },
    update: {},
    create: {
      userId: wannes.id,
      firstName: "Wannes",
      lastName: "Persyn",
      joinedAt: new Date("2020-01-01"),
      isPublic: true,
    },
  });

  await prisma.memberProfile.upsert({
    where: { userId: arne.id },
    update: {},
    create: {
      userId: arne.id,
      firstName: "Arne",
      lastName: "Vandepoel",
      joinedAt: new Date("2020-01-01"),
      isPublic: true,
    },
  });

  await prisma.memberProfile.upsert({
    where: { userId: gert.id },
    update: {},
    create: {
      userId: gert.id,
      firstName: "Gert",
      lastName: "Verbieren",
      joinedAt: new Date("2020-01-01"),
      isPublic: true,
    },
  });

  await prisma.memberProfile.upsert({
    where: { userId: jannes.id },
    update: {},
    create: {
      userId: jannes.id,
      firstName: "Jannes",
      lastName: "Devesse",
      joinedAt: new Date("2020-01-01"),
      isPublic: true,
    },
  });

  await prisma.memberProfile.upsert({
    where: { userId: joppe.id },
    update: {},
    create: {
      userId: joppe.id,
      firstName: "Joppe",
      lastName: "Van Loye",
      joinedAt: new Date("2020-01-01"),
      isPublic: true,
    },
  });

  await prisma.memberProfile.upsert({
    where: { userId: liselot.id },
    update: {},
    create: {
      userId: liselot.id,
      firstName: "Liselot",
      lastName: "Persyn",
      joinedAt: new Date("2020-01-01"),
      isPublic: true,
    },
  });

  await prisma.memberProfile.upsert({
    where: { userId: michiel.id },
    update: {},
    create: {
      userId: michiel.id,
      firstName: "Michiel",
      lastName: "Janssens",
      joinedAt: new Date("2020-01-01"),
      isPublic: true,
    },
  });

  await prisma.memberProfile.upsert({
    where: { userId: pieter.id },
    update: {},
    create: {
      userId: pieter.id,
      firstName: "Pieter",
      lastName: "David",
      joinedAt: new Date("2020-01-01"),
      isPublic: true,
    },
  });

  await prisma.memberProfile.upsert({
    where: { userId: roel.id },
    update: {},
    create: {
      userId: roel.id,
      firstName: "Roel",
      lastName: "Debecker",
      joinedAt: new Date("2020-01-01"),
      isPublic: true,
    },
  });

  console.log("  ✔  Member profiles");

  // ── News posts ─────────────────────────────────────────────────────────────

  await prisma.newsPost.upsert({
    where: { slug: "seizoensstart-2025" },
    update: {},
    create: {
      authorId: wannes.id,
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
      authorId: wannes.id,
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
      authorId: wannes.id,
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
      authorId: wannes.id,
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
      authorId: wannes.id,
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
      createdById: wannes.id,
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
      createdById: wannes.id,
      title: "Dorpelingenkoers 2025",
      description: "De jaarlijkse wielerwedstrijd voor dorpelingen. Open voor alle leeftijdscategorieën. Inschrijving aan de start.",
      location: "Marktplein, Brakel",
      startsAt: new Date("2025-09-14T10:00:00"),
      endsAt: new Date("2025-09-14T16:00:00"),
      isPublished: true,
    },
  });

  console.log("  ✔  Events");

  // ── Sponsors ───────────────────────────────────────────────────────────────

  const sponsorsData = [
    // Main tier (450+)
    { name: "APGV",                    tier: SponsorTier.MAIN,     websiteUrl: null, isActive: true, sortOrder:  1 },
    { name: "Garage Vanderborght",     tier: SponsorTier.MAIN,     websiteUrl: null, isActive: true, sortOrder:  2 },
    { name: "Het Poetsteam",           tier: SponsorTier.MAIN,     websiteUrl: null, isActive: true, sortOrder:  3 },
    { name: "De Zijbeuk",              tier: SponsorTier.MAIN,     websiteUrl: null, isActive: true, sortOrder:  4 },
    { name: "Michiel Janssens",        tier: SponsorTier.MAIN,     websiteUrl: null, isActive: true, sortOrder:  5 },
    // Gold tier (450)
    { name: "Aaron Casteels",          tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder:  6 },
    { name: "Argenta",                 tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder:  7 },
    { name: "BT tuinen",               tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder:  8 },
    { name: "BW works",                tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder:  9 },
    { name: "Connect Now / Wild Wines",tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 10 },
    { name: "De Hijsbeer",             tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 11 },
    { name: "Electro Bries",           tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 12 },
    { name: "Fortis / Alteraar",       tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 13 },
    { name: "Frituur De Wip",          tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 14 },
    { name: "Goeron",                  tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 15 },
    { name: "Het Interieurteam",       tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 16 },
    { name: "Huis Staes",              tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 17 },
    { name: "ijshoorntje",             tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 18 },
    { name: "Immo Francois",           tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 19 },
    { name: "Jan Stas",                tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 20 },
    { name: "JHworkx",                 tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 21 },
    { name: "Kaapwijn",                tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 22 },
    { name: "Kapper Kathleen",         tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 23 },
    { name: "Kim stuyckens",           tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 24 },
    { name: "KnippoVero",              tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 25 },
    { name: "Magnolia",                tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 26 },
    { name: "Niftix",                  tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 27 },
    { name: "Onan koffie",             tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 28 },
    { name: "Persoons",                tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 29 },
    { name: "Red EMU",                 tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 30 },
    { name: "Schoovaerts Dirk",        tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 31 },
    { name: "Service Koel",            tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 32 },
    { name: "SPAR Wijgmaal",           tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 33 },
    { name: "Sportoase",               tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 34 },
    { name: "Sportpret",               tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 35 },
    { name: "t Wit Madammeke",         tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 36 },
    { name: "VBM Verzekeringen",       tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 37 },
    { name: "Vejotech",                tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 38 },
    { name: "Vermaelen en Demuynck",   tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 39 },
    { name: "Vitesse fietsen",         tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 40 },
    { name: "Wimmar",                  tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 41 },
    { name: "Zippola",                 tier: SponsorTier.GOLD,     websiteUrl: null, isActive: true, sortOrder: 42 },
    // Standard tier (200)
    { name: "Autocenter Hein",         tier: SponsorTier.STANDARD, websiteUrl: null, isActive: true, sortOrder: 43 },
    { name: "De Skipastory",           tier: SponsorTier.STANDARD, websiteUrl: null, isActive: true, sortOrder: 44 },
    { name: "Dstny",                   tier: SponsorTier.STANDARD, websiteUrl: null, isActive: true, sortOrder: 45 },
    { name: "Paul Dechamps",           tier: SponsorTier.STANDARD, websiteUrl: null, isActive: true, sortOrder: 46 },
    { name: "Rodenbach Centrum",       tier: SponsorTier.STANDARD, websiteUrl: null, isActive: true, sortOrder: 47 },
    { name: "Sfeer en licht",          tier: SponsorTier.STANDARD, websiteUrl: null, isActive: true, sortOrder: 48 },
    { name: "Trattoria 2000",          tier: SponsorTier.STANDARD, websiteUrl: null, isActive: true, sortOrder: 49 },
    { name: "TripleDouble",            tier: SponsorTier.STANDARD, websiteUrl: null, isActive: true, sortOrder: 50 },
    { name: "Ynteriors",               tier: SponsorTier.STANDARD, websiteUrl: null, isActive: true, sortOrder: 51 },
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

  // ── Cycling race registrations ─────────────────────────────────────────────

  const registrationsData: Array<{
    firstName: string; lastName: string; dateOfBirth: string | null;
    gender: string; address: string; nationalRegisterNumber: string;
    email: string; phone: string; wielerclub: string | null;
    raceCategory: RaceCategory; status: RegistrationStatus;
    timestamp: Date;
  }> = [
    // ── Dorpelingenkoers ──────────────────────────────────────────────────────
    { firstName: "Wout",      lastName: "Verbieren",      dateOfBirth: "2003-04-18", gender: "M", address: "Kapelstraat 36  3110 Rotselaar",          nationalRegisterNumber: "03.04.18-201.58",  email: "gert.verbieren@telenet.be",       phone: "0468/287020",      wielerclub: null,                       raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-03T10:12:00") },
    { firstName: "Steven",    lastName: "Smout",           dateOfBirth: "1976-07-12", gender: "M", address: "Uitweg",                                  nationalRegisterNumber: "76-12-07-423.77",  email: "steven.smout4321@gmail.com",      phone: "0479532656",       wielerclub: "Wtc Doordrijvers",         raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-05T09:45:00") },
    { firstName: "Nicolas",   lastName: "Kayaerts",        dateOfBirth: "2002-09-16", gender: "M", address: "Berkenlaan 12 3110 Rotselaar",             nationalRegisterNumber: "02.09.16-239.94",  email: "nicolas.kayaerts1@gmail.com",     phone: "0468200022",       wielerclub: "De Doordrijvers",          raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-06T11:20:00") },
    { firstName: "Wouter",    lastName: "Remeysen",        dateOfBirth: "1979-02-08", gender: "M", address: "Kerkhofstraat 2A 3110 Rotselaar",          nationalRegisterNumber: "790208 415 48",    email: "wouter_remeysen@yahoo.com",       phone: "0473554837",       wielerclub: "WTC De Biekes",            raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-07T14:00:00") },
    { firstName: "Steven",    lastName: "Van De Weyer",    dateOfBirth: "1988-12-05", gender: "M", address: "Hoogland 119 Werchter",                    nationalRegisterNumber: "88.12.05-083.50",  email: "steven_1245@hotmail.coo",         phone: "0477305949",       wielerclub: "Amigo's Cycling Team",     raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-08T08:30:00") },
    { firstName: "Piet",      lastName: "Wuyts",           dateOfBirth: "2004-05-10", gender: "M", address: "Walstraat 7",                              nationalRegisterNumber: "04.06.10 -143 03", email: "pietwuyts1@gmail.com",            phone: "0494327893",       wielerclub: null,                       raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-09T16:05:00") },
    { firstName: "Tim",       lastName: "Bogaert",         dateOfBirth: "1996-01-06", gender: "M", address: "Gildenstraat 76 3111 Wezemaal",            nationalRegisterNumber: "96010632365",      email: "bogaert-tim@hotmail.com",         phone: "0491599037",       wielerclub: null,                       raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-10T10:00:00") },
    { firstName: "Roel",      lastName: "Wouters",         dateOfBirth: "1985-07-03", gender: "M", address: "Heirbaan 17c 3110 rotselaar",              nationalRegisterNumber: "85.07.03-103.89",  email: "woutersroel@hotmail.com",         phone: "0495/734360",      wielerclub: null,                       raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-10T10:15:00") },
    { firstName: "Steven",    lastName: "Sophie",          dateOfBirth: "1975-01-27", gender: "M", address: "Aarschotsesteenweg 268",                   nationalRegisterNumber: "75012710981",      email: "stevensophie@hotmail.com",        phone: "0499604916",       wielerclub: "WTC Doordrijvers",         raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-11T09:20:00") },
    { firstName: "Kurt",      lastName: "Develder",        dateOfBirth: "1972-01-01", gender: "M", address: "Vlasselaar 27. 3221 Nieuwrode",            nationalRegisterNumber: "72.01.01-095.36",  email: "kurt.develder@hotmail.com",       phone: "0497906574",       wielerclub: "Rct Rotselaar",            raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-11T11:45:00") },
    { firstName: "Lucas",     lastName: "Nelissen",        dateOfBirth: "1999-01-27", gender: "M", address: "Achterheidestraat 1b, Rotselaar",          nationalRegisterNumber: "99.01.27-287.19",  email: "lucasnelissen.ln@gmail.com",      phone: "0472084095",       wielerclub: null,                       raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-12T13:00:00") },
    { firstName: "Jelle",     lastName: "De Leeuw",        dateOfBirth: "1980-11-06", gender: "M", address: "Sint-Hadrianusstraat, 18 - 0001 Wijgmaal", nationalRegisterNumber: "80.11.06-181.38",  email: "jelle_de_leeuw@hotmail.com",      phone: "0489571773",       wielerclub: "De Biekes Wakkerzeel",     raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-13T09:10:00") },
    { firstName: "Roald",     lastName: "De Meyer",        dateOfBirth: "1989-04-12", gender: "M", address: "Beverlaak 16/18, 3118 Werchter",           nationalRegisterNumber: "89.04.12-279.94",  email: "roald_demeyer@hotmail.com",       phone: "0472693854",       wielerclub: "TEBEO",                    raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-14T15:30:00") },
    { firstName: "Stijn",     lastName: "Castel",          dateOfBirth: "1994-09-19", gender: "M", address: "Sint-Antoniuswijk, 72, Rotselaar",         nationalRegisterNumber: "94.09.19-279.24",  email: "stijncastel@protonmail.com",      phone: "0483427553",       wielerclub: null,                       raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-15T08:00:00") },
    { firstName: "Filip",     lastName: "Torfs",           dateOfBirth: "1969-10-28", gender: "M", address: "Ridderslaan 30a",                          nationalRegisterNumber: "69102819992",      email: "f.torfs@telenet.be",             phone: "0499945262",       wielerclub: "De doordrijvers Wezemaal", raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-16T10:20:00") },
    { firstName: "Stefaan",   lastName: "Persyn",          dateOfBirth: "1968-02-16", gender: "M", address: "Hellichtstraat 41 Rotselaar",               nationalRegisterNumber: "68021630179",      email: "persyn.stefaan@gmail.com",        phone: "0475 757752",      wielerclub: "De Doordrijvers",          raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-17T12:00:00") },
    { firstName: "Lara",      lastName: "Vuerinckx",       dateOfBirth: "1991-09-30", gender: "V", address: "Gebr. Van Tiltstraat 16 0101",              nationalRegisterNumber: "30091991-40092",   email: "l_vuerinckx@hotmail.com",         phone: "0456703663",       wielerclub: "Amigo's Cycling Team",     raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-18T09:00:00") },
    { firstName: "Noa",       lastName: "Tuyls",           dateOfBirth: "2004-04-26", gender: "M", address: "Leuvensebaan 44b rotselaar",                nationalRegisterNumber: "04042630526",      email: "noa.tuyls@telenet.be",            phone: "0468265126",       wielerclub: "Kaa Petaate",              raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-19T11:30:00") },
    { firstName: "Wannes",    lastName: "Persyn",          dateOfBirth: "2003-06-24", gender: "M", address: "Hellichtstraat 41",                         nationalRegisterNumber: "03.06.24-053.40",  email: "wannes.persyn@gmail.com",         phone: "0478088082",       wielerclub: null,                       raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-20T14:45:00") },
    { firstName: "Christof",  lastName: "De Groote",       dateOfBirth: "1982-06-02", gender: "M", address: "Rochusstraat 45",                           nationalRegisterNumber: "82060239746",      email: "christof_dg@hotmail.com",         phone: "0496836220",       wielerclub: "Tebeo Werchter",           raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-21T09:15:00") },
    { firstName: "Steven",    lastName: "Wijns",           dateOfBirth: "1971-09-19", gender: "M", address: "Rochusstraat 45 Werchter",                  nationalRegisterNumber: "71.09.19-105.06",  email: "steven.wijns1@telenet.be",        phone: "077629049",        wielerclub: "TBO Werchter",             raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-22T10:00:00") },
    { firstName: "Robin",     lastName: "Pottiez",         dateOfBirth: "1994-04-20", gender: "M", address: "Steenweg op nieuwrode 36 0201",             nationalRegisterNumber: "94042039141",      email: "robinpottiez@gmail.com",          phone: "0474625603",       wielerclub: "Asfalvreters",             raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-23T11:00:00") },
    { firstName: "Eddy",      lastName: "Valkenaers",      dateOfBirth: "1968-07-04", gender: "M", address: "Veldstraat 12",                             nationalRegisterNumber: "68070431167",      email: "eddy.valkenaers@telenet.be",      phone: "0473864656",       wielerclub: "RCT Rotselaar",            raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-24T08:30:00") },
    { firstName: "Sverre",    lastName: "Van Espen",       dateOfBirth: "2002-09-18", gender: "M", address: "Hanewijk",                                  nationalRegisterNumber: "02.09.18-143.33",  email: "sverrevanespen3@gmail.com",       phone: "0470 45 50 08",    wielerclub: null,                       raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-25T13:20:00") },
    { firstName: "Koen",      lastName: "De Craene",       dateOfBirth: "1980-06-13", gender: "M", address: "Kapelstraat 62",                            nationalRegisterNumber: "80-06.13-059.12",  email: "koen.decraene@me.com",            phone: "0478969353",       wielerclub: null,                       raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-26T15:00:00") },
    { firstName: "Ruben",     lastName: "Kestens",         dateOfBirth: "2001-12-11", gender: "M", address: "aarschotsesteenweg 657",                    nationalRegisterNumber: "01121135729",      email: "ruben.kestens@gmail.com",         phone: "0472500142",       wielerclub: "Cousins Cycling Team",     raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-27T09:00:00") },
    { firstName: "Rigo",      lastName: "Olemans",         dateOfBirth: "1964-08-31", gender: "M", address: "Catharinalaan 10, Rotselaar",               nationalRegisterNumber: "640831-29974",     email: "rigo.olemans@gmail.com",          phone: "0475584513",       wielerclub: null,                       raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-28T10:40:00") },
    { firstName: "Kristiaan", lastName: "Van Meerbeek",    dateOfBirth: "1968-10-13", gender: "M", address: "Groenstraat 34",                            nationalRegisterNumber: "68.10.13-243.89",  email: "kvm@leonidas.be",                 phone: "0476741033",       wielerclub: null,                       raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-29T11:00:00") },
    { firstName: "Gert",      lastName: "Verbieren",       dateOfBirth: "1974-06-21", gender: "M", address: "Kapelstraat 36 3110 Rotselaar",             nationalRegisterNumber: "74.06.21-295.89",  email: "gert.verbieren@telenet.be",       phone: "0476 762410",      wielerclub: "De flosj",                 raceCategory: RaceCategory.DORPELINGENKOERS, status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-30T08:00:00") },
    // ── Fun wedstrijd ─────────────────────────────────────────────────────────
    { firstName: "Tim",       lastName: "Colignon",        dateOfBirth: "2001-03-25", gender: "M", address: "Tervuursesteenweg 32a Perk",                nationalRegisterNumber: "010325-075-22",    email: "tim.colignon@gmail.com",          phone: "485349088",        wielerclub: null,                       raceCategory: RaceCategory.FUN_WEDSTRIJD,     status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-03T12:00:00") },
    { firstName: "Roel",      lastName: "Wouters",         dateOfBirth: "1985-07-03", gender: "M", address: "Heirbaan 17c 3110 rotselaar",              nationalRegisterNumber: "85.07.03-103.89",  email: "woutersroel@hotmail.com",         phone: "0495/734360",      wielerclub: null,                       raceCategory: RaceCategory.FUN_WEDSTRIJD,     status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-10T10:16:00") },
    { firstName: "Mauro",     lastName: "Van Ouytsel",     dateOfBirth: "2001-01-19", gender: "M", address: "Beverlaak 1 bus 0002, 3118 Werchter",      nationalRegisterNumber: "01.01.19-267.93",  email: "maurovanouytsel@hotmail.com",     phone: "0486536314",       wielerclub: null,                       raceCategory: RaceCategory.FUN_WEDSTRIJD,     status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-11T10:30:00") },
    { firstName: "Frank",     lastName: "Ysebaert",        dateOfBirth: "1982-01-22", gender: "M", address: "Knipsterweg 6 1560 Hoeilaart",              nationalRegisterNumber: "82012234149",      email: "ysebaert.frank@protonmail.ch",    phone: "0479483663",       wielerclub: "Control Cyclofitt",        raceCategory: RaceCategory.FUN_WEDSTRIJD,     status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-12T14:00:00") },
    { firstName: "Thomas",    lastName: "Milissen",        dateOfBirth: "2000-10-26", gender: "M", address: "Wijgmaalsesteenweg 123A, Haacht",           nationalRegisterNumber: "00102628997",      email: "thomas.milissen@icloud.com",      phone: "0473748644",       wielerclub: null,                       raceCategory: RaceCategory.FUN_WEDSTRIJD,     status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-13T09:45:00") },
    { firstName: "Lennert",   lastName: "Herman",          dateOfBirth: "1992-01-02", gender: "M", address: "Korbeek-losestraat 25 3001 Heverlee",       nationalRegisterNumber: "92.01.02-327.97",  email: "lennert.herman@hotmail.com",      phone: "0475500116",       wielerclub: null,                       raceCategory: RaceCategory.FUN_WEDSTRIJD,     status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-14T11:00:00") },
    { firstName: "Floris",    lastName: "Eggers",          dateOfBirth: "1999-04-10", gender: "M", address: "Martelarenlaan 22, Kessel-Lo",              nationalRegisterNumber: "99041025104",      email: "floris.eggers123@gmail.com",      phone: "0493186515",       wielerclub: null,                       raceCategory: RaceCategory.FUN_WEDSTRIJD,     status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-15T10:00:00") },
    { firstName: "Lucas",     lastName: "Soetemans",       dateOfBirth: "2001-06-23", gender: "M", address: "Kloosterstraat 19 Haacht",                  nationalRegisterNumber: "01062307704",      email: "lucsoetemans@gmail.com",          phone: "0468126708",       wielerclub: null,                       raceCategory: RaceCategory.FUN_WEDSTRIJD,     status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-16T13:30:00") },
    { firstName: "Loek",      lastName: "Torfs",           dateOfBirth: "2005-06-13", gender: "M", address: "Ridderstraat 30A, Rotselaar 3110",          nationalRegisterNumber: "05.06.13-239.32",  email: "loek.torfs@live.be",              phone: "0474563156",       wielerclub: null,                       raceCategory: RaceCategory.FUN_WEDSTRIJD,     status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-17T08:45:00") },
    { firstName: "Lukas",     lastName: "Vandenhaute",     dateOfBirth: "2000-03-20", gender: "M", address: "Sint-Jansbergsesteenweg 234",               nationalRegisterNumber: "00032000725",      email: "lukasvandenhaute@gmail.com",      phone: "0496371824",       wielerclub: null,                       raceCategory: RaceCategory.FUN_WEDSTRIJD,     status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-18T12:15:00") },
    { firstName: "Gilles",    lastName: "Puttevils",       dateOfBirth: "1995-12-29", gender: "M", address: "Rozenbergstraat 3",                         nationalRegisterNumber: "95122938350",      email: "gillesputtevils95@gmail.com",     phone: "0470604413",       wielerclub: null,                       raceCategory: RaceCategory.FUN_WEDSTRIJD,     status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-19T09:30:00") },
    { firstName: "Brent",     lastName: "Heynsmans",       dateOfBirth: "1994-08-08", gender: "M", address: "Wolfshaegen 123A, 3040 Neerijse",           nationalRegisterNumber: "94080813704",      email: "brent.heynsmans@outlook.com",     phone: "0477175745",       wielerclub: null,                       raceCategory: RaceCategory.FUN_WEDSTRIJD,     status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-20T11:00:00") },
    { firstName: "Laurens",   lastName: "De Ridder",       dateOfBirth: "1995-07-13", gender: "M", address: "Umafolaan 7 bus 101, Herent 3020",          nationalRegisterNumber: "95071341971",      email: "laurens.derid@gmail.com",         phone: "0470622615",       wielerclub: null,                       raceCategory: RaceCategory.FUN_WEDSTRIJD,     status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-21T14:00:00") },
    { firstName: "Wouter",    lastName: "De Donder",       dateOfBirth: "1995-05-05", gender: "M", address: "Smidstraat 61a, 2590 Berlaar",              nationalRegisterNumber: "95.05.05-257.71",  email: "dedonderwouter@gmail.com",        phone: "0492173949",       wielerclub: null,                       raceCategory: RaceCategory.FUN_WEDSTRIJD,     status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-22T09:00:00") },
    { firstName: "Jan",       lastName: "Vandendriessche", dateOfBirth: "1997-04-29", gender: "M", address: "Leopold De Vriesstraat 16",                 nationalRegisterNumber: "97.04.29-321.01",  email: "jann.vandendriessche@hotmail.com",phone: "049266868",        wielerclub: null,                       raceCategory: RaceCategory.FUN_WEDSTRIJD,     status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-23T10:30:00") },
    { firstName: "Brent",     lastName: "Eggerickx",       dateOfBirth: "1994-09-15", gender: "M", address: "Kapelbergstraat 3",                         nationalRegisterNumber: "940915-24779",     email: "brent_eggerickx@hotmail.com",     phone: "0479975581",       wielerclub: null,                       raceCategory: RaceCategory.FUN_WEDSTRIJD,     status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-24T11:45:00") },
    { firstName: "Gert",      lastName: "Verbieren",       dateOfBirth: "1974-06-21", gender: "M", address: "Kapelstraat 36 3110 Rotselaar",             nationalRegisterNumber: "74.06.21-295.89",  email: "gert.verbieren@telenet.be",       phone: "0476 76 2410",     wielerclub: null,                       raceCategory: RaceCategory.FUN_WEDSTRIJD,     status: RegistrationStatus.APPROVED, timestamp: new Date("2025-04-30T08:01:00") },
  ];

  for (const r of registrationsData) {
    const existing = await prisma.registration.findFirst({
      where: { nationalRegisterNumber: r.nationalRegisterNumber, raceCategory: r.raceCategory },
    });
    if (!existing) {
      await prisma.registration.create({ data: r });
    }
  }

  console.log("  ✔  Cycling registrations");

  await prisma.registrationSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, isOpen: true, dorpelingenkoersLimit: null, funWedstrijdLimit: null },
  });

  console.log("  ✔  Registration settings");

  // ── Historisch toernooi 2025 ───────────────────────────────────────────────

  const t25 = await prisma.tournament.upsert({
    where: { id: 2 },
    update: { name: "De Flosj Toernooi 2025", year: 2025, status: "COMPLETED" },
    create: { id: 2, name: "De Flosj Toernooi 2025", year: 2025, isActive: false, status: "COMPLETED", teamsPerPoule: 4, teamsAdvancingPerPoule: 2 },
  });

  for (const p of [
    { id: 145, name: "Poule A" }, { id: 146, name: "Poule B" }, { id: 147, name: "Poule C" },
    { id: 148, name: "Poule D" }, { id: 149, name: "Poule E" }, { id: 150, name: "Poule F" },
    { id: 151, name: "Poule G" }, { id: 152, name: "Poule H" }, { id: 153, name: "Poule I" },
    { id: 154, name: "Poule J" }, { id: 155, name: "Poule K" }, { id: 156, name: "Poule L" },
  ]) {
    await prisma.poule.upsert({
      where: { id: p.id },
      update: {},
      create: { id: p.id, tournamentId: t25.id, name: p.name, phase: Phase.GROUP },
    });
  }

  console.log("  ✔  Poules 2025");

  for (const t of [
    { id: 145, pouleId: 151, name: "Wouters & co",                   captainName: "Els Wouters",          s1: "Els Wouters",         s2: "Ann",                    s3: "Caroline",            s4: "Wim",                   played: 3, won: 1, drawn: 0, lost: 2, gf:  9, ga: 13, saldo:  -4, pts:  2 },
    { id: 146, pouleId: 147, name: "Bayernvrienden",                  captainName: "Eric Meyers",          s1: "Eric Meyers",         s2: "Frank Staes",            s3: "Kris Uytterhoeven",   s4: "Filip Gomand",          played: 3, won: 1, drawn: 0, lost: 2, gf: 12, ga: 19, saldo:  -7, pts:  2 },
    { id: 147, pouleId: 150, name: "Kanunniken van De Zijbeuk",       captainName: "Robert Pues",          s1: "Robert Pues",         s2: "Hugo",                   s3: "Philippe",            s4: "Erik",                  played: 3, won: 0, drawn: 0, lost: 3, gf:  7, ga: 28, saldo: -21, pts:  0 },
    { id: 148, pouleId: 155, name: "De Scheve Schieters",             captainName: "Valkenaers Eddy",      s1: "Valkenaers Eddy",     s2: "Bart Anthoon",           s3: "Granger Stehane",     s4: "Bart Storms",           played: 6, won: 4, drawn: 0, lost: 2, gf: 46, ga: 21, saldo:  25, pts:  8 },
    { id: 149, pouleId: 153, name: "De Boulettekes",                  captainName: "Veronique Bliki",      s1: "Veronique Bliki",     s2: "Ann Luyckx",             s3: "Arne Sophie",         s4: "Stefanie Gewelt",       played: 5, won: 3, drawn: 0, lost: 2, gf: 25, ga: 24, saldo:   1, pts:  6 },
    { id: 150, pouleId: 150, name: "The Founding Fathers",            captainName: "Wouter",               s1: "Wouter",              s2: "Dries",                  s3: "Bram",                s4: "Pieter-Jan",            played: 8, won: 7, drawn: 0, lost: 1, gf: 61, ga: 18, saldo:  43, pts: 14 },
    { id: 151, pouleId: 155, name: "4 Pinten Vast",                   captainName: "Ferre Sterckx",        s1: "Ferre Sterckx",       s2: "Wout Verbieren",         s3: "Eppe De Meersman",    s4: "Jannes Devesse",        played: 5, won: 3, drawn: 0, lost: 2, gf: 29, ga: 23, saldo:   6, pts:  6 },
    { id: 152, pouleId: 148, name: "De Losse Pols",                   captainName: "Daron Marina",         s1: "Daron Marina",        s2: "Hoeterickx Sven",        s3: "Vandepoel Mark",      s4: "Debecker Roel",         played: 5, won: 3, drawn: 0, lost: 2, gf: 38, ga: 24, saldo:  14, pts:  6 },
    { id: 153, pouleId: 152, name: "Vieze Asbak",                     captainName: "Simon David",          s1: "Simon David",         s2: "Sverre Sophie",          s3: "Giuseppe Angelilo",   s4: "Carlos Mazimpaka",      played: 3, won: 0, drawn: 2, lost: 1, gf:  9, ga: 19, saldo: -10, pts:  2 },
    { id: 154, pouleId: 148, name: "Jacobs Vrienden",                  captainName: "Mario Clé",           s1: "Mario Clé",           s2: "Bert Renap",             s3: "Steven Wouters",      s4: "Rudi Scheurs",          played: 8, won: 6, drawn: 0, lost: 2, gf: 64, ga: 41, saldo:  23, pts: 12 },
    { id: 155, pouleId: 154, name: "Team N-VA",                        captainName: "Elke",                s1: "Jan Schrijvers",       s2: "Robbe",                  s3: "Bart",                s4: "Elke",                  played: 3, won: 1, drawn: 0, lost: 2, gf: 10, ga: 20, saldo: -10, pts:  2 },
    { id: 156, pouleId: 147, name: "Ballen & Booze",                   captainName: "Ben Voets",           s1: "Ben Voets",           s2: "Jeroen Degent",          s3: "Jannes Van Hyfte",    s4: "Sam Eeckhout",          played: 6, won: 3, drawn: 0, lost: 3, gf: 31, ga: 21, saldo:  10, pts:  6 },
    { id: 157, pouleId: 149, name: "Stuikers",                         captainName: "Toon Coremans",       s1: "Toon Coremans",       s2: "Joren Wouters",          s3: "Dries van Weyenberg", s4: "Tjeu Vandezande",       played: 8, won: 6, drawn: 0, lost: 2, gf: 62, ga: 39, saldo:  23, pts: 12 },
    { id: 158, pouleId: 149, name: "Ibiza Girls",                      captainName: "Katrien Lemberechts", s1: "Katrien Lemberechts", s2: "Jan Lemberechts",        s3: "Els Costers",         s4: "Kris Baeten",           played: 6, won: 3, drawn: 1, lost: 2, gf: 38, ga: 34, saldo:   4, pts:  7 },
    { id: 159, pouleId: 152, name: "Balpetank",                        captainName: "Hans Sterckx",        s1: "Stekke",              s2: "Christof",               s3: "Bram",                s4: "Wouter",                played: 4, won: 1, drawn: 1, lost: 2, gf: 21, ga: 20, saldo:   1, pts:  3 },
    { id: 160, pouleId: 151, name: "De Boule Babes",                   captainName: "Lisa Baeten",         s1: "Lisa",                s2: "Nien",                   s3: "Hélène",              s4: "Nore",                  played: 5, won: 2, drawn: 0, lost: 3, gf: 19, ga: 32, saldo: -13, pts:  4 },
    { id: 161, pouleId: 145, name: "De Ketsers",                       captainName: "Femke Van Tongelen",  s1: "Femke Van Tongelen",  s2: "Brigitte Vernelen",      s3: ".",                   s4: ".",                     played: 3, won: 1, drawn: 0, lost: 2, gf:  6, ga: 19, saldo: -13, pts:  2 },
    { id: 162, pouleId: 146, name: "The Fishwives Club",               captainName: "Inge Van Hellemont",  s1: "Inge Van Hellemont",  s2: "Nikki Van Langendonck",  s3: "Leoni Smedts",        s4: "Annelies Verdeyen",     played: 3, won: 1, drawn: 0, lost: 2, gf: 13, ga: 14, saldo:  -1, pts:  2 },
    { id: 163, pouleId: 146, name: "De Spekjes",                       captainName: "Rebecca Serneels",    s1: "Rebecca",             s2: "Evi",                    s3: "Dennis",              s4: "Kenneth",               played: 4, won: 2, drawn: 0, lost: 2, gf: 23, ga: 23, saldo:   0, pts:  4 },
    { id: 164, pouleId: 148, name: "ADL (Achterheide Dijlekant Leeft)",captainName: "Hans Van Hyfte",      s1: "Hans Van Hyfte",      s2: "Marc Vermaelen",         s3: "Karl Hautekiet",      s4: "Gert Vermaelen",        played: 4, won: 2, drawn: 0, lost: 2, gf: 18, ga: 25, saldo:  -7, pts:  4 },
    { id: 165, pouleId: 152, name: "De 5er",                           captainName: "Bart Wuestenberghs",  s1: "Bart",                s2: "Yves",                   s3: "Robin",               s4: "Ive",                   played: 4, won: 3, drawn: 0, lost: 1, gf: 24, ga: 15, saldo:   9, pts:  6 },
    { id: 166, pouleId: 145, name: "Alé Boulézzz",                     captainName: "Jelle Wouters",       s1: "Jelle Wouters",       s2: "Nele Demuynck",          s3: "Tessa Heylighen",     s4: "Ann Van Criekinge",     played: 4, won: 1, drawn: 1, lost: 2, gf: 18, ga: 19, saldo:  -1, pts:  3 },
    { id: 167, pouleId: 153, name: "Niftix",                           captainName: "Robbe Wuestenberghs", s1: "Jordi",               s2: "Michel",                 s3: "Koen",                s4: "Robbe",                 played: 5, won: 2, drawn: 0, lost: 3, gf: 26, ga: 32, saldo:  -6, pts:  4 },
    { id: 168, pouleId: 153, name: "De Plakkers",                      captainName: "Lore",                s1: "Lore",                s2: "Janne",                  s3: "Fons",                s4: "Sonny",                 played: 8, won: 6, drawn: 0, lost: 2, gf: 46, ga: 25, saldo:  21, pts: 12 },
    { id: 169, pouleId: 150, name: "Wij zullen het nooit kunnen",      captainName: "Geert",               s1: "Beelen",              s2: "Daan",                   s3: "Jonas",               s4: "Joeri",                 played: 4, won: 3, drawn: 0, lost: 1, gf: 21, ga: 12, saldo:   9, pts:  6 },
    { id: 170, pouleId: 147, name: "Thursday After Work",              captainName: "Bart Goovaerts",      s1: "Bart Goovaerts",      s2: "Wener Baumans",          s3: "Luc Stroobants",      s4: "Kurt",                  played: 4, won: 2, drawn: 0, lost: 2, gf: 14, ga: 25, saldo: -11, pts:  4 },
    { id: 171, pouleId: 156, name: "Buskopain",                        captainName: "Wim Hombroux",        s1: "Wim",                 s2: "Slemme",                 s3: "Jef",                 s4: "Koen",                  played: 3, won: 0, drawn: 1, lost: 2, gf: 10, ga: 27, saldo: -17, pts:  1 },
    { id: 172, pouleId: 156, name: "De Stalen Ballen",                 captainName: "Kristof Vanschoote",  s1: "Kristof",             s2: "Wim",                    s3: "Paul",                s4: "Katrijn",               played: 3, won: 1, drawn: 0, lost: 2, gf: 10, ga: 15, saldo:  -5, pts:  2 },
    { id: 173, pouleId: 156, name: "De Ôoikes",                        captainName: "Roel Wouters",        s1: "Roel",                s2: "Axel",                   s3: "Hendrik",             s4: "Fille",                 played: 4, won: 3, drawn: 0, lost: 1, gf: 36, ga: 12, saldo:  24, pts:  6 },
    { id: 174, pouleId: 151, name: "Glory Balls",                      captainName: "Ynte De Wever",       s1: "Ynte De Wever",       s2: "Janick Demuynck",        s3: "Hans Speetjens",      s4: "Das",                   played: 4, won: 2, drawn: 0, lost: 2, gf: 26, ga: 13, saldo:  13, pts:  4 },
    { id: 175, pouleId: 147, name: "De Blauwe Ballen",                 captainName: "Yann Van Wassenhove", s1: "Diego Rotty",         s2: "Jan Panier",             s3: "Frits Traets",        s4: "Yann Van Wassenhove",   played: 6, won: 4, drawn: 0, lost: 2, gf: 45, ga: 31, saldo:  14, pts:  8 },
    { id: 176, pouleId: 155, name: "De Jufkes",                        captainName: "Lien Demuynck",       s1: "Lien Demuynck",       s2: "Bo Munnecom",            s3: "Janne Discart",       s4: "Ine Devos",             played: 3, won: 0, drawn: 0, lost: 3, gf:  7, ga: 25, saldo: -18, pts:  0 },
    { id: 177, pouleId: 146, name: "De Zilverwitjes",                  captainName: "Filip Verboven",      s1: "Filip",               s2: "Kim",                    s3: "Benny",               s4: "Kenny",                 played: 5, won: 3, drawn: 0, lost: 2, gf: 27, ga: 28, saldo:  -1, pts:  6 },
    { id: 178, pouleId: 154, name: "Tom Tom Manu",                     captainName: "Tom Verhaegen",       s1: "Tom Vanderelst",      s2: "Tom Verhaegen",          s3: "Manu",                s4: "Annelies",              played: 5, won: 3, drawn: 1, lost: 1, gf: 36, ga: 17, saldo:  19, pts:  7 },
    { id: 179, pouleId: 155, name: "Stalen Parels",                    captainName: "Jef Huybrechts",      s1: "Jef Huybrechts",      s2: "Niel",                   s3: "Giovanni",            s4: "Lukas",                 played: 4, won: 2, drawn: 0, lost: 2, gf: 15, ga: 28, saldo: -13, pts:  4 },
    { id: 180, pouleId: 154, name: "Theeznutz",                        captainName: "Bart Van Hout",       s1: "Bart",                s2: "Guido",                  s3: "Kenny",               s4: "Fille",                 played: 3, won: 0, drawn: 1, lost: 2, gf: 13, ga: 19, saldo:  -6, pts:  1 },
    { id: 181, pouleId: 153, name: "De Scheefschieters",               captainName: "Mathias",             s1: "Mathias",             s2: "Jeroen",                 s3: "Michael",             s4: "Kim",                   played: 3, won: 1, drawn: 0, lost: 2, gf: 11, ga: 22, saldo: -11, pts:  2 },
    { id: 182, pouleId: 152, name: "De Cnockaerts",                    captainName: "Freddy",              s1: "Freddy",              s2: "Tim",                    s3: "Fred",                s4: "Jef",                   played: 3, won: 0, drawn: 1, lost: 2, gf: 10, ga: 19, saldo:  -9, pts:  1 },
    { id: 183, pouleId: 145, name: "De Bloempjes",                     captainName: "Shane Vanuytrecht",   s1: "Shane",               s2: "Jestin",                 s3: "Jeff",                s4: "Wouter",                played: 4, won: 1, drawn: 0, lost: 3, gf: 17, ga: 21, saldo:  -4, pts:  2 },
    { id: 184, pouleId: 148, name: "Les Boulettes",                    captainName: "Barbara Gos",         s1: "Karen",               s2: "Inge",                   s3: "Caroline",            s4: "Kris",                  played: 3, won: 0, drawn: 0, lost: 3, gf: 11, ga: 26, saldo: -15, pts:  0 },
    { id: 185, pouleId: 149, name: "Kaapwijn",                         captainName: "Johan Vergauwen",     s1: "Johan Vergauwen",     s2: "Victor",                 s3: "Koen",                s4: "Tom",                   played: 3, won: 0, drawn: 0, lost: 3, gf:  9, ga: 26, saldo: -17, pts:  0 },
    { id: 186, pouleId: 146, name: "Coche au Chanel",                  captainName: "Jef Minten",          s1: "Michelle",            s2: "Jef",                    s3: "Marije",              s4: "Kevin",                 played: 5, won: 2, drawn: 0, lost: 3, gf: 21, ga: 33, saldo: -12, pts:  4 },
    { id: 187, pouleId: 145, name: "Jeu De Bâles",                     captainName: "Flor Heyrman",        s1: "Douwe Sterckx",       s2: "Noa Tuyls",              s3: "Senne Van Roosbroek", s4: "Flor Heyrman",          played: 4, won: 2, drawn: 1, lost: 1, gf: 28, ga: 15, saldo:  13, pts:  5 },
    { id: 188, pouleId: 154, name: "Suikers",                          captainName: "Hadwin Dedonder",     s1: "Martijn",             s2: "Hadwin",                 s3: "Kristien",            s4: "Catherine",             played: 4, won: 2, drawn: 0, lost: 2, gf: 19, ga: 26, saldo:  -7, pts:  4 },
    { id: 189, pouleId: 151, name: "De Kookies",                       captainName: "Merel Bollen",        s1: "Dries Wouters",       s2: "Merel Bollen",           s3: "Claire",              s4: "Kyana",                 played: 4, won: 2, drawn: 0, lost: 2, gf: 12, ga: 17, saldo:  -5, pts:  4 },
    { id: 190, pouleId: 156, name: "French Finesse",                   captainName: "Kaat Persyn",         s1: "Kaat",                s2: "Amber",                  s3: "Lau",                 s4: "Rosalie",               played: 4, won: 1, drawn: 1, lost: 2, gf: 11, ga: 22, saldo: -11, pts:  3 },
    { id: 191, pouleId: 150, name: "De Mosselbank",                    captainName: "Jana Osselaer",       s1: "Jana Osselaer",       s2: "Joyce Cuypers",          s3: "Dorien Lambrechts",   s4: "Dorien Vanwyngaerden",  played: 3, won: 1, drawn: 0, lost: 2, gf:  7, ga: 12, saldo:  -5, pts:  2 },
    { id: 192, pouleId: 149, name: "Team Vrije Tijd",                  captainName: "Sanne",               s1: "Tuur",                s2: "Wannes",                 s3: "Sanne",               s4: "",                      played: 4, won: 1, drawn: 1, lost: 2, gf: 20, ga: 32, saldo: -12, pts:  3 },
  ]) {
    await prisma.team.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id, tournamentId: t25.id, pouleId: t.pouleId, captainId: null,
        name: t.name, captainName: t.captainName,
        speler1: t.s1, speler2: t.s2, speler3: t.s3, speler4: t.s4,
        played: t.played, won: t.won, drawn: t.drawn, lost: t.lost,
        goalsFor: t.gf, goalsAgainst: t.ga, saldo: t.saldo, points: t.pts, isPresent: true,
      },
    });
  }

  console.log("  ✔  Teams 2025");

  const m25: Array<{ id: number; time: string; track: number; phase: Phase; bracketPos: string | null; scoreA: number; scoreB: number; pouleId: number | null; teamAId: number; teamBId: number; winnerId: number | null }> = [
    // ── Groepsfase ────────────────────────────────────────────────────────────
    // Track 1 – Poule A & B
    { id: 1291, time: "2025-10-31T17:00:00", track: 1, phase: Phase.GROUP, bracketPos: null, scoreA:  5, scoreB: 10, pouleId: 145, teamAId: 183, teamBId: 187, winnerId: 187 },
    { id: 1292, time: "2025-10-31T17:20:00", track: 1, phase: Phase.GROUP, bracketPos: null, scoreA:  8, scoreB:  7, pouleId: 146, teamAId: 163, teamBId: 186, winnerId: 163 },
    { id: 1293, time: "2025-10-31T17:40:00", track: 1, phase: Phase.GROUP, bracketPos: null, scoreA:  3, scoreB:  4, pouleId: 145, teamAId: 166, teamBId: 161, winnerId: 161 },
    { id: 1294, time: "2025-10-31T18:00:00", track: 1, phase: Phase.GROUP, bracketPos: null, scoreA:  4, scoreB:  6, pouleId: 146, teamAId: 162, teamBId: 177, winnerId: 177 },
    { id: 1295, time: "2025-10-31T18:20:00", track: 1, phase: Phase.GROUP, bracketPos: null, scoreA:  5, scoreB:  0, pouleId: 145, teamAId: 183, teamBId: 161, winnerId: 183 },
    { id: 1296, time: "2025-10-31T18:40:00", track: 1, phase: Phase.GROUP, bracketPos: null, scoreA:  7, scoreB:  1, pouleId: 146, teamAId: 163, teamBId: 177, winnerId: 163 },
    { id: 1297, time: "2025-10-31T19:00:00", track: 1, phase: Phase.GROUP, bracketPos: null, scoreA:  4, scoreB:  4, pouleId: 145, teamAId: 166, teamBId: 187, winnerId: null },
    { id: 1298, time: "2025-10-31T19:20:00", track: 1, phase: Phase.GROUP, bracketPos: null, scoreA:  2, scoreB:  4, pouleId: 146, teamAId: 162, teamBId: 186, winnerId: 186 },
    { id: 1299, time: "2025-10-31T19:40:00", track: 1, phase: Phase.GROUP, bracketPos: null, scoreA:  3, scoreB:  6, pouleId: 145, teamAId: 183, teamBId: 166, winnerId: 166 },
    { id: 1300, time: "2025-10-31T20:00:00", track: 1, phase: Phase.GROUP, bracketPos: null, scoreA:  4, scoreB:  7, pouleId: 146, teamAId: 163, teamBId: 162, winnerId: 162 },
    { id: 1301, time: "2025-10-31T20:20:00", track: 1, phase: Phase.GROUP, bracketPos: null, scoreA: 11, scoreB:  2, pouleId: 145, teamAId: 187, teamBId: 161, winnerId: 187 },
    { id: 1302, time: "2025-10-31T20:40:00", track: 1, phase: Phase.GROUP, bracketPos: null, scoreA:  2, scoreB: 13, pouleId: 146, teamAId: 186, teamBId: 177, winnerId: 177 },
    // Track 2 – Poule C & D
    { id: 1303, time: "2025-10-31T17:00:00", track: 2, phase: Phase.GROUP, bracketPos: null, scoreA:  6, scoreB:  7, pouleId: 147, teamAId: 156, teamBId: 175, winnerId: 175 },
    { id: 1304, time: "2025-10-31T17:20:00", track: 2, phase: Phase.GROUP, bracketPos: null, scoreA: 13, scoreB:  4, pouleId: 148, teamAId: 154, teamBId: 184, winnerId: 154 },
    { id: 1305, time: "2025-10-31T17:40:00", track: 2, phase: Phase.GROUP, bracketPos: null, scoreA:  8, scoreB:  1, pouleId: 147, teamAId: 146, teamBId: 170, winnerId: 146 },
    { id: 1306, time: "2025-10-31T18:00:00", track: 2, phase: Phase.GROUP, bracketPos: null, scoreA:  4, scoreB:  6, pouleId: 148, teamAId: 152, teamBId: 164, winnerId: 164 },
    { id: 1307, time: "2025-10-31T18:20:00", track: 2, phase: Phase.GROUP, bracketPos: null, scoreA:  3, scoreB:  4, pouleId: 147, teamAId: 156, teamBId: 170, winnerId: 170 },
    { id: 1308, time: "2025-10-31T18:40:00", track: 2, phase: Phase.GROUP, bracketPos: null, scoreA:  9, scoreB:  5, pouleId: 148, teamAId: 154, teamBId: 164, winnerId: 154 },
    { id: 1309, time: "2025-10-31T19:00:00", track: 2, phase: Phase.GROUP, bracketPos: null, scoreA:  1, scoreB: 10, pouleId: 147, teamAId: 146, teamBId: 175, winnerId: 175 },
    { id: 1310, time: "2025-10-31T19:20:00", track: 2, phase: Phase.GROUP, bracketPos: null, scoreA:  6, scoreB:  2, pouleId: 148, teamAId: 152, teamBId: 184, winnerId: 152 },
    { id: 1311, time: "2025-10-31T19:40:00", track: 2, phase: Phase.GROUP, bracketPos: null, scoreA:  8, scoreB:  3, pouleId: 147, teamAId: 156, teamBId: 146, winnerId: 156 },
    { id: 1312, time: "2025-10-31T20:00:00", track: 2, phase: Phase.GROUP, bracketPos: null, scoreA:  5, scoreB:  9, pouleId: 148, teamAId: 154, teamBId: 152, winnerId: 152 },
    { id: 1313, time: "2025-10-31T20:20:00", track: 2, phase: Phase.GROUP, bracketPos: null, scoreA:  3, scoreB:  7, pouleId: 147, teamAId: 175, teamBId: 170, winnerId: 170 },
    { id: 1314, time: "2025-10-31T20:40:00", track: 2, phase: Phase.GROUP, bracketPos: null, scoreA:  5, scoreB:  7, pouleId: 148, teamAId: 184, teamBId: 164, winnerId: 164 },
    // Track 3 – Poule E & F
    { id: 1315, time: "2025-10-31T17:00:00", track: 3, phase: Phase.GROUP, bracketPos: null, scoreA:  9, scoreB:  9, pouleId: 149, teamAId: 192, teamBId: 158, winnerId: null },
    { id: 1316, time: "2025-10-31T17:20:00", track: 3, phase: Phase.GROUP, bracketPos: null, scoreA:  2, scoreB: 12, pouleId: 150, teamAId: 147, teamBId: 150, winnerId: 150 },
    { id: 1317, time: "2025-10-31T17:40:00", track: 3, phase: Phase.GROUP, bracketPos: null, scoreA:  3, scoreB: 15, pouleId: 149, teamAId: 185, teamBId: 157, winnerId: 157 },
    { id: 1318, time: "2025-10-31T18:00:00", track: 3, phase: Phase.GROUP, bracketPos: null, scoreA:  4, scoreB:  1, pouleId: 150, teamAId: 169, teamBId: 191, winnerId: 169 },
    { id: 1319, time: "2025-10-31T18:20:00", track: 3, phase: Phase.GROUP, bracketPos: null, scoreA:  5, scoreB:  7, pouleId: 149, teamAId: 192, teamBId: 157, winnerId: 157 },
    { id: 1320, time: "2025-10-31T18:40:00", track: 3, phase: Phase.GROUP, bracketPos: null, scoreA:  3, scoreB:  5, pouleId: 150, teamAId: 147, teamBId: 191, winnerId: 191 },
    { id: 1321, time: "2025-10-31T19:00:00", track: 3, phase: Phase.GROUP, bracketPos: null, scoreA:  3, scoreB:  6, pouleId: 149, teamAId: 185, teamBId: 158, winnerId: 158 },
    { id: 1322, time: "2025-10-31T19:20:00", track: 3, phase: Phase.GROUP, bracketPos: null, scoreA:  4, scoreB:  3, pouleId: 150, teamAId: 169, teamBId: 150, winnerId: 169 },
    { id: 1323, time: "2025-10-31T19:40:00", track: 3, phase: Phase.GROUP, bracketPos: null, scoreA:  5, scoreB:  3, pouleId: 149, teamAId: 192, teamBId: 185, winnerId: 192 },
    { id: 1324, time: "2025-10-31T20:00:00", track: 3, phase: Phase.GROUP, bracketPos: null, scoreA:  2, scoreB: 11, pouleId: 150, teamAId: 147, teamBId: 169, winnerId: 169 },
    { id: 1325, time: "2025-10-31T20:20:00", track: 3, phase: Phase.GROUP, bracketPos: null, scoreA:  5, scoreB:  9, pouleId: 149, teamAId: 158, teamBId: 157, winnerId: 157 },
    { id: 1326, time: "2025-10-31T20:40:00", track: 3, phase: Phase.GROUP, bracketPos: null, scoreA:  5, scoreB:  1, pouleId: 150, teamAId: 150, teamBId: 191, winnerId: 150 },
    // Track 4 – Poule G & H
    { id: 1327, time: "2025-10-31T17:00:00", track: 4, phase: Phase.GROUP, bracketPos: null, scoreA:  2, scoreB: 10, pouleId: 151, teamAId: 160, teamBId: 174, winnerId: 174 },
    { id: 1328, time: "2025-10-31T17:20:00", track: 4, phase: Phase.GROUP, bracketPos: null, scoreA: 10, scoreB:  3, pouleId: 152, teamAId: 159, teamBId: 182, winnerId: 159 },
    { id: 1329, time: "2025-10-31T17:40:00", track: 4, phase: Phase.GROUP, bracketPos: null, scoreA:  1, scoreB:  4, pouleId: 151, teamAId: 145, teamBId: 189, winnerId: 189 },
    { id: 1330, time: "2025-10-31T18:00:00", track: 4, phase: Phase.GROUP, bracketPos: null, scoreA:  0, scoreB: 10, pouleId: 152, teamAId: 153, teamBId: 165, winnerId: 165 },
    { id: 1331, time: "2025-10-31T18:20:00", track: 4, phase: Phase.GROUP, bracketPos: null, scoreA:  4, scoreB:  6, pouleId: 151, teamAId: 160, teamBId: 189, winnerId: 189 },
    { id: 1332, time: "2025-10-31T18:40:00", track: 4, phase: Phase.GROUP, bracketPos: null, scoreA:  3, scoreB:  7, pouleId: 152, teamAId: 159, teamBId: 165, winnerId: 165 },
    { id: 1333, time: "2025-10-31T19:00:00", track: 4, phase: Phase.GROUP, bracketPos: null, scoreA:  4, scoreB:  3, pouleId: 151, teamAId: 145, teamBId: 174, winnerId: 145 },
    { id: 1334, time: "2025-10-31T19:20:00", track: 4, phase: Phase.GROUP, bracketPos: null, scoreA:  4, scoreB:  4, pouleId: 152, teamAId: 153, teamBId: 182, winnerId: null },
    { id: 1335, time: "2025-10-31T19:40:00", track: 4, phase: Phase.GROUP, bracketPos: null, scoreA:  6, scoreB:  4, pouleId: 151, teamAId: 160, teamBId: 145, winnerId: 160 },
    { id: 1336, time: "2025-10-31T20:00:00", track: 4, phase: Phase.GROUP, bracketPos: null, scoreA:  5, scoreB:  5, pouleId: 152, teamAId: 159, teamBId: 153, winnerId: null },
    { id: 1337, time: "2025-10-31T20:20:00", track: 4, phase: Phase.GROUP, bracketPos: null, scoreA:  7, scoreB:  0, pouleId: 151, teamAId: 174, teamBId: 189, winnerId: 174 },
    { id: 1338, time: "2025-10-31T20:40:00", track: 4, phase: Phase.GROUP, bracketPos: null, scoreA:  3, scoreB:  5, pouleId: 152, teamAId: 182, teamBId: 165, winnerId: 165 },
    // Track 5 – Poule I & J
    { id: 1339, time: "2025-10-31T17:00:00", track: 5, phase: Phase.GROUP, bracketPos: null, scoreA:  3, scoreB:  5, pouleId: 153, teamAId: 168, teamBId: 149, winnerId: 149 },
    { id: 1340, time: "2025-10-31T17:20:00", track: 5, phase: Phase.GROUP, bracketPos: null, scoreA:  6, scoreB:  2, pouleId: 154, teamAId: 155, teamBId: 180, winnerId: 155 },
    { id: 1341, time: "2025-10-31T17:40:00", track: 5, phase: Phase.GROUP, bracketPos: null, scoreA: 10, scoreB:  0, pouleId: 153, teamAId: 167, teamBId: 181, winnerId: 167 },
    { id: 1342, time: "2025-10-31T18:00:00", track: 5, phase: Phase.GROUP, bracketPos: null, scoreA:  4, scoreB:  5, pouleId: 154, teamAId: 188, teamBId: 178, winnerId: 178 },
    { id: 1343, time: "2025-10-31T18:20:00", track: 5, phase: Phase.GROUP, bracketPos: null, scoreA:  8, scoreB:  4, pouleId: 153, teamAId: 168, teamBId: 181, winnerId: 168 },
    { id: 1344, time: "2025-10-31T18:40:00", track: 5, phase: Phase.GROUP, bracketPos: null, scoreA:  2, scoreB: 11, pouleId: 154, teamAId: 155, teamBId: 178, winnerId: 178 },
    { id: 1345, time: "2025-10-31T19:00:00", track: 5, phase: Phase.GROUP, bracketPos: null, scoreA:  3, scoreB:  8, pouleId: 153, teamAId: 167, teamBId: 149, winnerId: 149 },
    { id: 1346, time: "2025-10-31T19:20:00", track: 5, phase: Phase.GROUP, bracketPos: null, scoreA:  8, scoreB:  6, pouleId: 154, teamAId: 188, teamBId: 180, winnerId: 188 },
    { id: 1347, time: "2025-10-31T19:40:00", track: 5, phase: Phase.GROUP, bracketPos: null, scoreA: 10, scoreB:  0, pouleId: 153, teamAId: 168, teamBId: 167, winnerId: 168 },
    { id: 1348, time: "2025-10-31T20:00:00", track: 5, phase: Phase.GROUP, bracketPos: null, scoreA:  2, scoreB:  7, pouleId: 154, teamAId: 155, teamBId: 188, winnerId: 188 },
    { id: 1349, time: "2025-10-31T20:20:00", track: 5, phase: Phase.GROUP, bracketPos: null, scoreA:  4, scoreB:  7, pouleId: 153, teamAId: 149, teamBId: 181, winnerId: 181 },
    { id: 1350, time: "2025-10-31T20:40:00", track: 5, phase: Phase.GROUP, bracketPos: null, scoreA:  5, scoreB:  5, pouleId: 154, teamAId: 180, teamBId: 178, winnerId: null },
    // Track 6 – Poule K & L
    { id: 1351, time: "2025-10-31T17:00:00", track: 6, phase: Phase.GROUP, bracketPos: null, scoreA:  2, scoreB:  8, pouleId: 155, teamAId: 176, teamBId: 151, winnerId: 151 },
    { id: 1352, time: "2025-10-31T17:20:00", track: 6, phase: Phase.GROUP, bracketPos: null, scoreA:  3, scoreB:  6, pouleId: 156, teamAId: 171, teamBId: 172, winnerId: 172 },
    { id: 1353, time: "2025-10-31T17:40:00", track: 6, phase: Phase.GROUP, bracketPos: null, scoreA:  1, scoreB: 12, pouleId: 155, teamAId: 179, teamBId: 148, winnerId: 148 },
    { id: 1354, time: "2025-10-31T18:00:00", track: 6, phase: Phase.GROUP, bracketPos: null, scoreA:  0, scoreB: 10, pouleId: 156, teamAId: 190, teamBId: 173, winnerId: 173 },
    { id: 1355, time: "2025-10-31T18:20:00", track: 6, phase: Phase.GROUP, bracketPos: null, scoreA:  3, scoreB:  9, pouleId: 155, teamAId: 176, teamBId: 148, winnerId: 148 },
    { id: 1356, time: "2025-10-31T18:40:00", track: 6, phase: Phase.GROUP, bracketPos: null, scoreA:  2, scoreB: 16, pouleId: 156, teamAId: 171, teamBId: 173, winnerId: 173 },
    { id: 1357, time: "2025-10-31T19:00:00", track: 6, phase: Phase.GROUP, bracketPos: null, scoreA:  6, scoreB:  5, pouleId: 155, teamAId: 179, teamBId: 151, winnerId: 179 },
    { id: 1358, time: "2025-10-31T19:20:00", track: 6, phase: Phase.GROUP, bracketPos: null, scoreA:  4, scoreB:  1, pouleId: 156, teamAId: 190, teamBId: 172, winnerId: 190 },
    { id: 1359, time: "2025-10-31T19:40:00", track: 6, phase: Phase.GROUP, bracketPos: null, scoreA:  2, scoreB:  8, pouleId: 155, teamAId: 176, teamBId: 179, winnerId: 179 },
    { id: 1360, time: "2025-10-31T20:00:00", track: 6, phase: Phase.GROUP, bracketPos: null, scoreA:  5, scoreB:  5, pouleId: 156, teamAId: 171, teamBId: 190, winnerId: null },
    { id: 1361, time: "2025-10-31T20:20:00", track: 6, phase: Phase.GROUP, bracketPos: null, scoreA:  8, scoreB:  7, pouleId: 155, teamAId: 151, teamBId: 148, winnerId: 151 },
    { id: 1362, time: "2025-10-31T20:40:00", track: 6, phase: Phase.GROUP, bracketPos: null, scoreA:  3, scoreB:  8, pouleId: 156, teamAId: 172, teamBId: 173, winnerId: 173 },
    // ── R16 ───────────────────────────────────────────────────────────────────
    { id: 1363, time: "2025-10-31T21:20:00", track: 1, phase: Phase.R16, bracketPos: "Roos-R16-1",  scoreA:  2, scoreB:  7, pouleId: null, teamAId: 173, teamBId: 160, winnerId: 160 },
    { id: 1364, time: "2025-10-31T21:20:00", track: 2, phase: Phase.R16, bracketPos: "Roos-R16-2",  scoreA:  6, scoreB:  7, pouleId: null, teamAId: 174, teamBId: 158, winnerId: 158 },
    { id: 1365, time: "2025-10-31T21:20:00", track: 3, phase: Phase.R16, bracketPos: "Roos-R16-3",  scoreA:  7, scoreB:  0, pouleId: null, teamAId: 154, teamBId: 164, winnerId: 154 },
    { id: 1366, time: "2025-10-31T21:20:00", track: 4, phase: Phase.R16, bracketPos: "Roos-R16-4",  scoreA: 13, scoreB:  0, pouleId: null, teamAId: 152, teamBId: 188, winnerId: 152 },
    { id: 1367, time: "2025-10-31T21:20:00", track: 5, phase: Phase.R16, bracketPos: "Groen-R16-1", scoreA:  2, scoreB:  9, pouleId: null, teamAId: 165, teamBId: 167, winnerId: 167 },
    { id: 1368, time: "2025-10-31T21:20:00", track: 6, phase: Phase.R16, bracketPos: "Groen-R16-2", scoreA:  8, scoreB:  5, pouleId: null, teamAId: 175, teamBId: 166, winnerId: 175 },
    { id: 1369, time: "2025-10-31T21:40:00", track: 1, phase: Phase.R16, bracketPos: "Groen-R16-3", scoreA: 13, scoreB:  1, pouleId: null, teamAId: 178, teamBId: 192, winnerId: 178 },
    { id: 1370, time: "2025-10-31T21:40:00", track: 2, phase: Phase.R16, bracketPos: "Groen-R16-4", scoreA: 11, scoreB:  2, pouleId: null, teamAId: 150, teamBId: 170, winnerId: 150 },
    { id: 1371, time: "2025-10-31T21:40:00", track: 3, phase: Phase.R16, bracketPos: "Oranje-R16-1",scoreA:  2, scoreB:  6, pouleId: null, teamAId: 169, teamBId: 186, winnerId: 186 },
    { id: 1372, time: "2025-10-31T21:40:00", track: 4, phase: Phase.R16, bracketPos: "Oranje-R16-2",scoreA:  6, scoreB:  2, pouleId: null, teamAId: 168, teamBId: 190, winnerId: 168 },
    { id: 1373, time: "2025-10-31T21:40:00", track: 5, phase: Phase.R16, bracketPos: "Oranje-R16-3",scoreA:  3, scoreB:  4, pouleId: null, teamAId: 187, teamBId: 156, winnerId: 156 },
    { id: 1374, time: "2025-10-31T21:40:00", track: 6, phase: Phase.R16, bracketPos: "Oranje-R16-4",scoreA:  4, scoreB:  8, pouleId: null, teamAId: 163, teamBId: 149, winnerId: 149 },
    { id: 1375, time: "2025-10-31T22:00:00", track: 1, phase: Phase.R16, bracketPos: "Blauw-R16-1", scoreA:  5, scoreB:  4, pouleId: null, teamAId: 157, teamBId: 183, winnerId: 157 },
    { id: 1376, time: "2025-10-31T22:00:00", track: 2, phase: Phase.R16, bracketPos: "Blauw-R16-2", scoreA:  5, scoreB:  3, pouleId: null, teamAId: 177, teamBId: 159, winnerId: 177 },
    { id: 1377, time: "2025-10-31T22:00:00", track: 3, phase: Phase.R16, bracketPos: "Blauw-R16-3", scoreA:  9, scoreB:  0, pouleId: null, teamAId: 148, teamBId: 179, winnerId: 148 },
    { id: 1378, time: "2025-10-31T22:00:00", track: 4, phase: Phase.R16, bracketPos: "Blauw-R16-4", scoreA:  5, scoreB:  2, pouleId: null, teamAId: 151, teamBId: 189, winnerId: 151 },
    // ── R8 ────────────────────────────────────────────────────────────────────
    { id: 1379, time: "2025-10-31T22:20:00", track: 1, phase: Phase.R8, bracketPos: "Roos-R8-1",   scoreA:  0, scoreB: 10, pouleId: null, teamAId: 160, teamBId: 158, winnerId: 158 },
    { id: 1380, time: "2025-10-31T22:20:00", track: 2, phase: Phase.R8, bracketPos: "Roos-R8-2",   scoreA: 11, scoreB:  6, pouleId: null, teamAId: 154, teamBId: 152, winnerId: 154 },
    { id: 1381, time: "2025-10-31T22:20:00", track: 3, phase: Phase.R8, bracketPos: "Groen-R8-1",  scoreA:  4, scoreB: 12, pouleId: null, teamAId: 167, teamBId: 175, winnerId: 175 },
    { id: 1382, time: "2025-10-31T22:20:00", track: 4, phase: Phase.R8, bracketPos: "Groen-R8-2",  scoreA:  2, scoreB:  5, pouleId: null, teamAId: 178, teamBId: 150, winnerId: 150 },
    { id: 1383, time: "2025-10-31T22:20:00", track: 5, phase: Phase.R8, bracketPos: "Oranje-R8-1", scoreA:  2, scoreB:  8, pouleId: null, teamAId: 186, teamBId: 168, winnerId: 168 },
    { id: 1384, time: "2025-10-31T22:20:00", track: 6, phase: Phase.R8, bracketPos: "Oranje-R8-2", scoreA:  7, scoreB:  0, pouleId: null, teamAId: 156, teamBId: 149, winnerId: 156 },
    { id: 1385, time: "2025-10-31T22:40:00", track: 1, phase: Phase.R8, bracketPos: "Blauw-R8-1",  scoreA: 12, scoreB:  2, pouleId: null, teamAId: 157, teamBId: 177, winnerId: 157 },
    { id: 1386, time: "2025-10-31T22:40:00", track: 2, phase: Phase.R8, bracketPos: "Blauw-R8-2",  scoreA:  6, scoreB:  3, pouleId: null, teamAId: 148, teamBId: 151, winnerId: 148 },
    // ── Kwartfinales ──────────────────────────────────────────────────────────
    { id: 1387, time: "2025-10-31T23:00:00", track: 1, phase: Phase.QUARTER, bracketPos: "Roos-QUARTER-1",  scoreA: 1, scoreB: 7, pouleId: null, teamAId: 158, teamBId: 154, winnerId: 154 },
    { id: 1388, time: "2025-10-31T23:00:00", track: 2, phase: Phase.QUARTER, bracketPos: "Groen-QUARTER-1", scoreA: 5, scoreB: 8, pouleId: null, teamAId: 175, teamBId: 150, winnerId: 150 },
    { id: 1389, time: "2025-10-31T23:00:00", track: 3, phase: Phase.QUARTER, bracketPos: "Oranje-QUARTER-1",scoreA: 4, scoreB: 3, pouleId: null, teamAId: 168, teamBId: 156, winnerId: 168 },
    { id: 1390, time: "2025-10-31T23:00:00", track: 4, phase: Phase.QUARTER, bracketPos: "Blauw-QUARTER-1", scoreA: 6, scoreB: 3, pouleId: null, teamAId: 157, teamBId: 148, winnerId: 157 },
    // ── Halve finales ─────────────────────────────────────────────────────────
    { id: 1391, time: "2025-10-31T23:30:00", track: 1, phase: Phase.SEMI, bracketPos: "ROOS_GROEN-SEMI",   scoreA:  1, scoreB: 10, pouleId: null, teamAId: 154, teamBId: 150, winnerId: 150 },
    { id: 1392, time: "2025-10-31T23:30:00", track: 2, phase: Phase.SEMI, bracketPos: "ORANJE_BLAUW-SEMI", scoreA:  6, scoreB:  2, pouleId: null, teamAId: 168, teamBId: 157, winnerId: 168 },
    // ── Finale & troostfinale ─────────────────────────────────────────────────
    { id: 1393, time: "2025-10-31T00:00:00", track: 2, phase: Phase.FINAL,             bracketPos: "2-FINAL-1",              scoreA: 7,  scoreB: 1, pouleId: null, teamAId: 150, teamBId: 168, winnerId: 150 },
    { id: 1394, time: "2025-11-01T00:00:00", track: 5, phase: Phase.CONSOLATION_FINAL, bracketPos: "1-CONSOLATION_FINAL-2", scoreA: 11, scoreB: 6, pouleId: null, teamAId: 154, teamBId: 157, winnerId: 154 },
  ];

  for (const m of m25) {
    await prisma.match.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id, tournamentId: t25.id, pouleId: m.pouleId,
        teamAId: m.teamAId, teamBId: m.teamBId, winnerId: m.winnerId,
        scoreA: m.scoreA, scoreB: m.scoreB,
        time: new Date(m.time), track: m.track, phase: m.phase, bracketPos: m.bracketPos,
      },
    });
  }

  console.log("  ✔  Wedstrijden 2025");

  const tb25 = await prisma.tiebreaker.upsert({
    where: { tournamentId: t25.id },
    update: { winnerId: 152 },
    create: { tournamentId: t25.id, winnerId: 152 },
  });
  await prisma.tiebreakTeam.upsert({
    where: { tiebreakId_teamId: { tiebreakId: tb25.id, teamId: 152 } },
    update: { score: 2 },
    create: { tiebreakId: tb25.id, teamId: 152, score: 2 },
  });
  await prisma.tiebreakTeam.upsert({
    where: { tiebreakId_teamId: { tiebreakId: tb25.id, teamId: 188 } },
    update: { score: 1 },
    create: { tiebreakId: tb25.id, teamId: 188, score: 1 },
  });

  console.log("  ✔  Tiebreaker 2025");

  // Reset sequences so auto-increment works correctly after explicit IDs
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Tournament"', 'id'), GREATEST((SELECT MAX(id) FROM "Tournament"), 1))`;
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Poule"', 'id'),      GREATEST((SELECT MAX(id) FROM "Poule"),      1))`;
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Team"', 'id'),       GREATEST((SELECT MAX(id) FROM "Team"),       1))`;
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Match"', 'id'),      GREATEST((SELECT MAX(id) FROM "Match"),      1))`;

  console.log("\n✅  Seed voltooid!");
  console.log("\n   Admin logins (wachtwoord voor iedereen: Password123!):");
  console.log("   wannes.persyn@gmail.com");
  console.log("   arne.vandepoel@gmail.com");
  console.log("   gert.verbiern@gmail.com");
  console.log("   jannes.devesse@gmail.com");
  console.log("   joppe.vanloye@gmail.com");
  console.log("   liselot.persyn@gmail.com");
  console.log("   michiel.janssens@gmail.com");
  console.log("   pieter.david@gmail.com");
  console.log("   roel.debecker@gmail.com\n");
}

main()
  .catch((e) => {
    console.error("❌  Seed mislukt:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
