-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_notifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'fr',
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "push_notifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "two_factor_secret" TEXT;
