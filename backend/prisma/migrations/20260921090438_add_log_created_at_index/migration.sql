-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "logs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "rooms" ALTER COLUMN "capacity" DROP DEFAULT,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "id" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "logs_created_at_idx" ON "logs"("created_at");

-- RenameIndex
ALTER INDEX "Room_name_key" RENAME TO "rooms_name_key";
