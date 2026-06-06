Security & GDPR Review — DeFlosj Backend
Stack: Node.js + TypeScript, Express + Helmet, Prisma + PostgreSQL, JWT (jsonwebtoken), argon2id

Kritieke kwetsbaarheden 🔴

5. Rijksregisternummer onversleuteld opgeslagen — directe AVG-violation
Bestand: prisma/schema.prisma:569, src/repositories/registrationRepository.ts

// Huidig: plaintext in DB
nationalRegisterNumber String @unique

// Minimaal vereiste — versleuteld opslaan (AES-256-GCM):
import { createCipheriv, randomBytes, createDecipheriv } from "crypto";

const encrypt = (value: string): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(process.env.FIELD_ENCRYPTION_KEY!, "hex"), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
};

Belangrijke verbeterpunten 🟡

Best practice verbeteringen 🟢
17. UUID als auto-increment integer IDs
IDs zijn sequentiële integers (id @id @default(autoincrement())). Hoewel dit op zichzelf geen beveiligingslek is als autorisatie correct is, lekken ze de omvang van de database en zijn ze voorspelbaar. Gebruik cuid() of uuid() als primaire sleutels voor publiek zichtbare resources.

18. Geen isNaN-check na parseRegistrationId

// In meerdere routes:
res.json(await approveRegistration(Number.parseInt(req.params.id, 10)));
// Geen NaN-check → Prisma-error lekt door als 500
Enkele routes doen dit wel (members), anderen niet (registrations, tournament).

19. findOrCreateUserByEmail maakt user met leeg wachtwoord
Bestand: src/repositories/userRepository.ts:101


return prisma.user.create({ data: { email, username, password: "", isActive: false } });
Een lege string als wachtwoord is nooit valid via bcrypt, maar is een security smell. Genereer een crypto.randomBytes(32).toString("hex") als placeholder.

GDPR Compliance Checklist
Recht / Verplichting	Status	Toelichting
Art. 15 — Recht op inzage	⚠️ Gedeeltelijk	/auth/me geeft user-object, maar niet alle gekoppelde data (registraties, shifts, attendance)
Art. 16 — Recht op rectificatie	⚠️ Gedeeltelijk	Alleen PATCH /members/me; geen wachtwoord-wijziging, geen e-mail-update
Art. 17 — Recht op vergetelheid	❌ Ontbreekt	Geen account-deletion endpoint; nationalRegisterNumber en shifts blijven bestaan
Art. 20 — Dataportabiliteit	❌ Ontbreekt	Geen JSON/CSV-export van eigen data voor de betrokkene zelf
Art. 21 — Recht op bezwaar	❌ Ontbreekt	Geen opt-out mechanisme voor verwerkingen
Art. 7 — Toestemming vastleggen	❌ Ontbreekt	Geen consent-timestamp, geen versie van privacybeleid
Art. 32 — Beveiliging verwerking	⚠️ Gedeeltelijk	Passwords gehasht, maar rijksregisternummer plaintext, geen rate limiting
Art. 33 — Melding datalek (72u)	⚠️ Gedeeltelijk	Geen audit log van kritieke acties; reconstruction is moeilijk
Bewaartermijn	❌ Ontbreekt	Geen retention policy, geen automatische verwijdering
Dataminimalisatie	⚠️ Twijfelachtig	Rijksregisternummer: rechtsgrond onduidelijk voor VZW
Verwerkersregister	❌ Niet controleerbaar	Vercel, SMTP-provider niet gedocumenteerd
HSTS	✅ Aanwezig	Helmet stelt standaard in (180 dagen)
Geen plaintext secrets in git	✅ OK	.env in .gitignore, .env.example bevat geen echte waarden
SQL-injectie	✅ OK	Prisma met parameterized queries; geen raw queries gevonden
