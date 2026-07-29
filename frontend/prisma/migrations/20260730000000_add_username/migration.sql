-- AlterTable
ALTER TABLE "User" ADD COLUMN "username" VARCHAR(30);
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
