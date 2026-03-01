/*
  Warnings:

  - You are about to drop the `Porcionado` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Hamburguesa` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Porcionado_estado_idx";

-- DropIndex
DROP INDEX "Porcionado_gramaje_idx";

-- DropIndex
DROP INDEX "Porcionado_fecha_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Porcionado";
PRAGMA foreign_keys=on;

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
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Hamburguesa_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Hamburguesa" ("cantidad", "createdAt", "deliveryId", "descripcion", "gramaje", "id", "precio", "tipo") SELECT "cantidad", "createdAt", "deliveryId", "descripcion", "gramaje", "id", "precio", "tipo" FROM "Hamburguesa";
DROP TABLE "Hamburguesa";
ALTER TABLE "new_Hamburguesa" RENAME TO "Hamburguesa";
CREATE INDEX "Hamburguesa_deliveryId_idx" ON "Hamburguesa"("deliveryId");
CREATE INDEX "Hamburguesa_estado_idx" ON "Hamburguesa"("estado");
CREATE INDEX "Hamburguesa_gramaje_idx" ON "Hamburguesa"("gramaje");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
