-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Hamburguesa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deliveryId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'hamburguesa',
    "cantidad" INTEGER NOT NULL,
    "gramaje" REAL NOT NULL,
    "precio" REAL,
    "descripcion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Hamburguesa_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Hamburguesa" ("cantidad", "createdAt", "deliveryId", "descripcion", "gramaje", "id") SELECT "cantidad", "createdAt", "deliveryId", "descripcion", "gramaje", "id" FROM "Hamburguesa";
DROP TABLE "Hamburguesa";
ALTER TABLE "new_Hamburguesa" RENAME TO "Hamburguesa";
CREATE INDEX "Hamburguesa_deliveryId_idx" ON "Hamburguesa"("deliveryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
