-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pago" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "deliveryId" TEXT,
    "monto" REAL NOT NULL,
    "fechaPago" DATETIME NOT NULL,
    "metodo" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pago_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pago_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Pago" ("clientId", "createdAt", "deliveryId", "descripcion", "fechaPago", "id", "metodo", "monto", "updatedAt") SELECT "clientId", "createdAt", "deliveryId", "descripcion", "fechaPago", "id", "metodo", "monto", "updatedAt" FROM "Pago";
DROP TABLE "Pago";
ALTER TABLE "new_Pago" RENAME TO "Pago";
CREATE INDEX "Pago_clientId_idx" ON "Pago"("clientId");
CREATE INDEX "Pago_deliveryId_idx" ON "Pago"("deliveryId");
CREATE INDEX "Pago_fechaPago_idx" ON "Pago"("fechaPago");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
