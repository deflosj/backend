-- AddIndex: Registration.status, raceCategory, email
CREATE INDEX "Registration_status_idx" ON "Registration"("status");
CREATE INDEX "Registration_raceCategory_idx" ON "Registration"("raceCategory");
CREATE INDEX "Registration_email_idx" ON "Registration"("email");

-- AddIndex: Tournament.isActive, year
CREATE INDEX "Tournament_isActive_idx" ON "Tournament"("isActive");
CREATE INDEX "Tournament_year_idx" ON "Tournament"("year");
