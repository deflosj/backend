-- Shiftsysteem (shiften, taken, RSVP's, helper-invitelinks) verwijderd.
-- LET OP: dit verwijdert die data definitief. Helpers leven nu in "Helper".
DROP TABLE IF EXISTS "ShiftRegistration";
DROP TABLE IF EXISTS "ShiftSlot";
DROP TABLE IF EXISTS "ShiftGroup";
DROP TABLE IF EXISTS "TaskAssignee";
DROP TABLE IF EXISTS "Task";
DROP TABLE IF EXISTS "Attendance";
DROP TABLE IF EXISTS "InviteToken";

DROP TYPE IF EXISTS "Shift";
DROP TYPE IF EXISTS "TaskStatus";
DROP TYPE IF EXISTS "RSVPStatus";
