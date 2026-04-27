-- Normalize any unexpected legacy role values before replacing the enum.
ALTER TYPE "Role" RENAME TO "Role_old";

CREATE TYPE "Role" AS ENUM ('ADMIN', 'EMPLOYEE');

ALTER TABLE "User"
  ALTER COLUMN "role" DROP DEFAULT;

UPDATE "User"
SET "role" = 'EMPLOYEE'::"Role_old"
WHERE "role"::text NOT IN ('ADMIN', 'EMPLOYEE');

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "Role"
  USING ("role"::text::"Role");

ALTER TABLE "User"
  ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';

DROP TYPE "Role_old";
