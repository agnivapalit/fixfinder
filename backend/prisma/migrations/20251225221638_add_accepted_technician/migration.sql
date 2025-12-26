-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrls" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "jobDoneAt" DATETIME,
    "acceptedTechnicianId" TEXT,
    CONSTRAINT "Listing_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Listing_acceptedTechnicianId_fkey" FOREIGN KEY ("acceptedTechnicianId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Listing" ("category", "createdAt", "customerId", "description", "expiresAt", "id", "imageUrls", "jobDoneAt", "status", "title", "updatedAt") SELECT "category", "createdAt", "customerId", "description", "expiresAt", "id", "imageUrls", "jobDoneAt", "status", "title", "updatedAt" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
