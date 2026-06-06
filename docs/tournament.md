# Tornooi — User Stories & Feature Spec

> **Implementatiestatus** — Features gemarkeerd met ✅ zijn al gebouwd. Features zonder markering moeten nog worden gebouwd.

---

## Rollen

| Rol | Omschrijving |
|-----|-------------|
| **Admin / Superadmin** | Volledig beheer van het tornooi |
| **Referee** | Scores invoeren via eigen portaal (`/referee`) |
| **Captain** | Vertegenwoordiger van een team — beperkte acties voor zijn/haar team |
| **Teamspeler** | Lid van een team — kan inloggen en eigen teaminfo raadplegen |
| **Publiek** | Read-only via publieke route — geen auth vereist |

---

## Rollenmatrix

| Functie | Admin | Referee | Captain | Teamspeler | Publiek |
|---------|-------|---------|---------|------------|---------|
| Tornooi aanmaken / configureren | ✓ | — | — | — | — |
| Teams beheren | ✓ | — | — | — | — |
| Aanwezigheid registreren (check-in) | ✓ | — | — | — | — |
| Matchen genereren | ✓ | — | — | — | — |
| Score wijzigen (poule) | ✓ | ✓ | — | — | — |
| Score wijzigen (KO & tiebreaker) | ✓ | ✓ | — | — | — |
| Tijd / baan / teams wijzigen | ✓ | — | — | — | — |
| Vertraging toepassen | ✓ | — | — | — | — |
| Reglement bewerken | ✓ | — | — | — | — |
| Tiebreaker aanmaken | ✓ | — | — | — | — |
| KO-matchen beheren (structuur) | ✓ | — | — | — | — |
| TV-modus activeren & bekijken | ✓ | — | — | — | — |
| Eigen teaminfo bekijken | ✓ | — | ✓ | ✓ | — |
| Eigen matchen bekijken | ✓ | ✓ | ✓ | ✓ | ✓ |
| Standen bekijken | ✓ | ✓ | ✓ | ✓ | ✓ |
| Schema bekijken | ✓ | ✓ | ✓ | ✓ | ✓ |
| Reglement bekijken | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## EPIC 1: Tornooi aanmaken — configuratiewizard

---

### US-01 · Tornooi configureren via wizard

**Story:**
Als een admin, wil ik bij het aanmaken van een tornooi een stapsgewijze wizard doorlopen, zodat het systeem automatisch de juiste structuur (poules, KO-ronde, tijdsloten) berekent.

**Wizard stappen:**

| Stap | Veld | Type |
|------|------|------|
| 1 | Naam + jaar | tekst / getal |
| 2 | Aantal teams | getal |
| 3 | Aantal teams per poule | getal (bv. 4) |
| 4 | Aantal teams dat automatisch doorgaat per poule | getal (bv. top 2) |
| 5 | Aantal beste N-de plaatsen dat extra doorgaat | getal + welke plaats (bv. 8 beste 3des) |
| 6 | Speelduur per match (minuten) | getal (bv. 15) |
| 7 | Aantal beschikbare banen | getal |
| 8 | Starttijd tornooi | tijd |

**Acceptatiecriteria:**
- [ ] Admin doorloopt de wizard stap voor stap met terugknop
- [ ] Het systeem berekent automatisch het aantal poules, de KO-ronde (R16 / R8 / kwartfinale / halve finale / finale) en het totaal aantal matchen
- [ ] Het systeem genereert automatisch tijdsloten op basis van speelduur × aantal banen
- [ ] Het systeem valideert elke stap voor verder gaan (bv. teams per poule ≤ totaal teams)
- [ ] Bij ongeldige invoer toont het systeem een duidelijke foutmelding per veld
- [ ] Na voltooiing van de wizard wordt het tornooi aangemaakt en is het bewerkbaar

**Opmerkingen:**
- Tijdslot-generator: automatisch op basis van speelduur + banen — **bevestigd**
- Elk jaar een apart tornooi onder hetzelfde admin-account — **bevestigd**

---

## EPIC 2: Teams & aanwezigheid

---

### US-02 · Teams beheren ✅

**Story:**
Als een admin, wil ik teams kunnen toevoegen, bewerken, verwijderen en toewijzen aan een poule, zodat de tornooistructuur correct is opgebouwd.

**Acceptatiecriteria:**
- [x] Admin kan teams toevoegen, hernoemen en verwijderen
- [x] Admin kan een team toewijzen aan een poule
- [x] Verwijdering van een team met geplande matchen vraagt een bevestiging

---

### US-03 · Aanwezigheid registreren (check-in)

**Story:**
Als een admin, wil ik per team kunnen aanduiden of ze aanwezig zijn op de dag zelf, zodat de schema's en standen kloppen zonder no-shows.

**Acceptatiecriteria:**
- [x] Admin ziet een lijst van alle teams met een aanwezigheidsschakelaar (toggle)
- [ ] Teams melden zich fysiek aan bij de inschrijvingstafel; de admin markeert ze als "aanwezig" in het systeem
- [ ] Een afwezig team wordt duidelijk gemarkeerd in de teamlijst
- [ ] Matchen van afwezige teams worden automatisch als forfait geregistreerd (score te bepalen door admin, bv. 2–0)
- [ ] De aanwezigheidsstatus is aanpasbaar zolang het tornooi loopt

**Opmerkingen:**
- Geen QR-code check-in door teams zelf — admin doet de check-in manueel aan de balie

---

## EPIC 3: Schema & wedstrijdbeheer

---

### US-04 · Wedstrijden automatisch genereren ✅

**Story:**
Als een admin, wil ik dat de poulewedstrijden automatisch worden gegenereerd op basis van de configuratie, zodat ik dit niet manueel hoef in te plannen.

**Acceptatiecriteria:**
- [x] Het systeem genereert automatisch alle poulewedstrijden in vaste volgorde: 1v3 → 2v4 → 1v4 → 2v3 → 1v2 → 3v4
- [x] Elke gegenereerde wedstrijd heeft een starttijd, baan en status "niet gespeeld"
- [x] De gegenereerde wedstrijden zijn na aanmaak bewerkbaar

---

### US-05 · Match beheren — score, tijd, baan, teams ✅

**Story:**
Als een admin, wil ik per wedstrijd de score, tijd, baan en teams kunnen aanpassen, zodat ik fouten kan corrigeren en het schema flexibel kan bijhouden.

**Acceptatiecriteria:**
- [x] Admin kan de score van elke wedstrijd inline ingeven en aanpassen
- [x] Admin kan de geplande tijd van een wedstrijd wijzigen
- [x] Admin kan de baan van een wedstrijd wijzigen
- [x] Admin kan de deelnemende teams van een wedstrijd wisselen
- [x] Een ingevulde wedstrijd toont een groene achtergrond + gekleurde linker border
- [x] Een niet-ingevulde wedstrijd heeft een duidelijk andere visuele status

---

### US-06 · KO-matchen beheren in admin SchemaTab

**Story:**
Als een admin, wil ik ook de KO-matchen (kwartfinale, halve finale, finale) kunnen invullen en bewerken via de SchemaTab, zodat het volledige tornooi vanuit één plek beheerd wordt.

**Acceptatiecriteria:**
- [ ] De SchemaTab toont zowel GROUP-matchen als KO-matchen
- [ ] Admin kan score, tijd en baan van KO-matchen aanpassen
- [ ] KO-matchen zijn visueel onderscheiden van poulewedstrijden (bv. label of sectie)
- [ ] Na het invullen van een KO-match wordt de volgende ronde automatisch bijgewerkt

**Opmerkingen:**
- Huidige `SchemaTab` filtert enkel op `groupPoules` — KO-matchen zijn nog niet bewerkbaar via de admin UI

---

### US-07 · Vertraging doorvoeren ✅

**Story:**
Als een admin, wil ik een vertragingswaarde instellen die automatisch op alle toekomstige wedstrijden wordt toegepast, zodat het schema realistisch blijft bij oplopende vertraging.

**Acceptatiecriteria:**
- [x] Admin kan een vertraging instellen in minuten
- [x] De vertraging wordt toegepast op alle nog niet gestarte wedstrijden
- [x] Al gespeelde wedstrijden worden niet aangepast
- [ ] Het systeem toont een bevestigingsdialoog voor de vertraging wordt doorgevoerd
- [ ] De vertraging kan worden gereset

---

## EPIC 4: Tiebreakers

---

### US-08 · Tiebreakers detecteren en oplossen

**Story:**
Als een admin, wil ik tiebreakers automatisch zien en kunnen oplossen via een extra match, zodat de doorstroom naar de KO-fase correct en transparant verloopt.

**Acceptatiecriteria:**
- [ ] Het systeem detecteert automatisch tiebreakers op doorstootposities na het invullen van alle poulewedstrijden
- [ ] Teams in een tiebreaker krijgen een oranje badge of markering in de poulestand
- [ ] Admin kan een tiebreaker-match aanmaken voor de betrokken teams (`phase: "TIEBREAK"`)
- [ ] Tiebreaker-matches zijn zichtbaar in het schema, apart gegroepeerd of gelabeld
- [ ] Na het invullen van de tiebreaker-score wordt de doorgestoten ploeg automatisch bepaald en de bracket bijgewerkt

---

## EPIC 5: Reglement

---

### US-09 · Reglement bewerken ✅

**Story:**
Als een admin, wil ik het reglement van het tornooi vrij kunnen bewerken, zodat teams en referees de actuele regels altijd kunnen raadplegen.

**Acceptatiecriteria:**
- [x] Admin kan het reglement bewerken via een vrije teksteditor
- [x] Het reglement is zichtbaar voor referees en publiek

---

## EPIC 6: Referee portaal

---

### US-10 · Scores invoeren als referee

**Story:**
Als een referee, wil ik via een apart portaal (`/referee`) de score van alle wedstrijden kunnen invoeren — inclusief KO-matchen en tiebreakers — zodat ik dit snel kan doen op mijn telefoon of tablet zonder toegang tot het admin-paneel.

**Acceptatiecriteria:**
- [ ] Referee logt in via de bestaande auth-flow; het systeem detecteert de `REFEREE` rol en stuurt door naar `/referee`
- [ ] Referee ziet een lijst van lopende en komende matchen voor het actieve tornooi, inclusief KO-matchen en tiebreakers
- [ ] Per match kan de referee de score (A – B) invoeren en opslaan, ongeacht de fase (poule / tiebreaker / KO)
- [ ] Matchen zijn duidelijk gelabeld met hun fase: `POULE`, `TIEBREAK`, `KO`
- [ ] Na opslaan verschijnt een bevestigingsscherm met de ingevoerde score
- [ ] Referee kan een al ingevoerde score nog corrigeren zolang de match niet is afgesloten
- [ ] De score is direct zichtbaar in het admin-paneel na opslaan
- [ ] Referee heeft **geen** toegang tot: teams bewerken, tijden/banen wijzigen, tornooi-instellingen, tiebreaker aanmaken

**UI-vereisten:**
- Grote, duidelijke interface — optimaal op telefoon en tablet
- Duidelijke weergave per match: fase, baan, geplande tijd, teams
- Optioneel: referee filtert op zijn/haar toegewezen baan

**Opmerkingen:**
- `REFEREE` rol bestaat al in `routePermissions.ts` — enkel portaal nog te bouwen
- Referee ziet **enkel** score-invoer; tijd, baan en structuur zijn read-only

---

## EPIC 7: Captain & teamspeler portaal

---

### US-14 · Inloggen als captain of teamspeler

**Story:**
Als een captain of teamspeler, wil ik kunnen inloggen met mijn account, zodat ik toegang krijg tot mijn persoonlijke teamomgeving.

**Acceptatiecriteria:**
- [ ] Captain en teamspeler loggen in via de bestaande auth-flow
- [ ] Het systeem detecteert de rol en stuurt door naar de juiste omgeving (`/team` of gelijkaardig)
- [ ] Een teamspeler is gekoppeld aan exact één team
- [ ] Een captain is ook een teamspeler, maar met extra rechten binnen zijn/haar team
- [ ] Zonder koppeling aan een team ziet de gebruiker een melding dat hij/zij nog niet is toegewezen

---

### US-15 · Eigen teaminfo en schema raadplegen als teamspeler

**Story:**
Als een teamspeler, wil ik na het inloggen mijn eigen teaminfo en wedstrijdschema zien, zodat ik weet wanneer en waar ik moet spelen.

**Acceptatiecriteria:**
- [ ] Teamspeler ziet de naam, poule en leden van zijn/haar team
- [ ] Teamspeler ziet alle wedstrijden van zijn/haar team (tijd, baan, tegenstander, score)
- [ ] Gespeelde wedstrijden tonen het eindresultaat
- [ ] Komende wedstrijden zijn duidelijk gemarkeerd
- [ ] Teamspeler kan de algemene poulestand en het reglement raadplegen
- [ ] Teamspeler heeft **geen** toegang tot andere teams of admin-functies

---

### US-16 · Captain beheert teamleden

**Story:**
Als een captain, wil ik de leden van mijn team kunnen beheren, zodat de teamsamenstelling correct en up-to-date is.

**Acceptatiecriteria:**
- [ ] Captain ziet een lijst van alle leden gekoppeld aan zijn/haar team
- [ ] Captain kan een uitnodiging sturen naar een speler (bv. via e-mail of code)
- [ ] Captain kan een lid verwijderen uit het team
- [ ] Captain kan zichzelf niet verwijderen als captain
- [ ] Wijzigingen in de teamsamenstelling zijn zichtbaar voor de admin

**Opmerkingen / vragen:**
- Kunnen spelers zichzelf registreren en een team kiezen, of worden ze altijd door admin/captain toegevoegd?
- Is er een maximum aantal spelers per team?

---

## EPIC 8: Publieke weergave & TV-modus

---

### US-11 · Toeschouwers volgen het tornooi live (publieke route) ✅ deels

**Story:**
Als een toeschouwer, wil ik via een publieke pagina de standen, het schema en de lopende matchen kunnen volgen, zodat ik op de hoogte blijf zonder in te loggen.

**Acceptatiecriteria:**
- [ ] Publieke route is toegankelijk zonder authenticatie
- [ ] Standen, schema en bracket zijn live zichtbaar
- [ ] Pagina werkt correct op mobiel

---

### US-12 · TV-modus / schermweergave

**Story:**
Als een admin, wil ik een read-only schermweergave kunnen openen die automatisch ververst, zodat ik dit op een tv of groot scherm in de zaal kan tonen.

**Acceptatiecriteria:**
- [ ] TV-modus is enkel toegankelijk voor ingelogde admins (geen publieke URL)
- [ ] Admin kan de TV-modus openen vanuit het admin-paneel (bv. knop "Open op scherm")
- [ ] Toont: huidige matchen, standen, volgende matchen
- [ ] Pagina ververst automatisch (polling of websocket)
- [ ] Grote, goed leesbare weergave op tv-formaat — geen navigatie of admin-controls zichtbaar
- [ ] Geen interactieve elementen (read-only weergave)

---

## EPIC 9: Meerdere tornooien

---

### US-13 · Meerdere tornooien beheren

**Story:**
Als een admin, wil ik meerdere tornooien kunnen aanmaken en beheren vanuit één account (bv. editie per jaar), zodat de historiek bewaard blijft en ik elk jaar opnieuw kan starten.

**Acceptatiecriteria:**
- [ ] Admin ziet een overzichtslijst van alle tornooien (naam, jaar, status)
- [ ] Admin kan een nieuw tornooi aanmaken zonder het vorige te verwijderen
- [ ] Admin kan wisselen tussen tornooien
- [ ] Elk tornooi heeft een eigen status: `concept` / `actief` / `afgelopen`
- [ ] Slechts één tornooi is tegelijk `actief` (het actieve tornooi is wat referees en publiek te zien krijgen)

---

## Openstaande beslissingen

| # | Vraag | Beslissing |
|---|-------|-----------|
| 1 | Tijdslot-generator: automatisch of manueel? | ✅ Automatisch |
| 2 | Referee portaal: aparte route `/referee`? | ✅ Ja, eigen route |
| 3 | Referee: enkel score, of ook tijd bevestigen? | ✅ Enkel score; tijd is read-only |
| 4 | Forfait-knop? | ❌ Nee |
| 5 | Meerdere tornooien per account? | ✅ Ja |
| 6 | Team check-in via QR? | ❌ Nee — admin markeert manueel aan de balie |
| 7 | Automatische KO-bracket na poules? | ✅ Ja |
| 8 | TV-modus / schermweergave? | ✅ Ja |
| 9 | Match-log / audit trail? | ❌ Nee (voorlopig) |
| 10 | Export naar PDF / Excel? | ❌ Nee |
| 11 | Notificaties? | ❌ Nee |