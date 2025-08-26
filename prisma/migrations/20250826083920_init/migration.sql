-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "kindeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Account_kindeId_idx" ON "Account"("kindeId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_kindeId_accountNumber_key" ON "Account"("kindeId", "accountNumber");
