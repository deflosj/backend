-- Remove the single-assignee FK from Task; use TaskAssignee exclusively.
ALTER TABLE "Task" DROP COLUMN IF EXISTS "assignedToId";

-- Add isPrimary flag to TaskAssignee so one helper can be marked as lead.
ALTER TABLE "TaskAssignee" ADD COLUMN IF NOT EXISTS "isPrimary" BOOLEAN NOT NULL DEFAULT false;
