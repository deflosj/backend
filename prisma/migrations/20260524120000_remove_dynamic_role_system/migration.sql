-- DropForeignKey
ALTER TABLE "UserRoleRel" DROP CONSTRAINT IF EXISTS "UserRoleRel_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserRoleRel" DROP CONSTRAINT IF EXISTS "UserRoleRel_roleId_fkey";

-- DropTable
DROP TABLE IF EXISTS "UserRoleRel";

-- DropTable
DROP TABLE IF EXISTS "Role";
