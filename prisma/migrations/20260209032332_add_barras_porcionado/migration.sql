-- CreateTable
CREATE TABLE "Barra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pesoGramos" REAL NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "fechaProduccion" DATETIME NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Porcionado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "producto" TEXT NOT NULL DEFAULT 'hamburguesa',
    "gramaje" REAL NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Barra_fechaProduccion_idx" ON "Barra"("fechaProduccion");

-- CreateIndex
CREATE INDEX "Barra_pesoGramos_idx" ON "Barra"("pesoGramos");

-- CreateIndex
CREATE INDEX "Barra_disponible_idx" ON "Barra"("disponible");

-- CreateIndex
CREATE INDEX "Porcionado_fecha_idx" ON "Porcionado"("fecha");

-- CreateIndex
CREATE INDEX "Porcionado_gramaje_idx" ON "Porcionado"("gramaje");

-- CreateIndex
CREATE INDEX "Porcionado_estado_idx" ON "Porcionado"("estado");
