-- Motto per ploeg. IF NOT EXISTS: veilig als de kolom al met de hand werd toegevoegd.
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "motto" TEXT;
