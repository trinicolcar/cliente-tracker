/*
  Warnings:

  - You are about to alter the column `cantidad` on the `Barra` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Barra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pesoGramos" REAL NOT NULL,
    "cantidad" REAL NOT NULL,
    "fechaProduccion" DATETIME NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Barra" ("cantidad", "createdAt", "disponible", "fechaProduccion", "id", "pesoGramos", "updatedAt") SELECT "cantidad", "createdAt", "disponible", "fechaProduccion", "id", "pesoGramos", "updatedAt" FROM "Barra";
DROP TABLE "Barra";
ALTER TABLE "new_Barra" RENAME TO "Barra";
CREATE INDEX "Barra_fechaProduccion_idx" ON "Barra"("fechaProduccion");
CREATE INDEX "Barra_pesoGramos_idx" ON "Barra"("pesoGramos");
CREATE INDEX "Barra_disponible_idx" ON "Barra"("disponible");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
