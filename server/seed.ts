import { PrismaClient } from '@prisma/client';
import { mockClients } from '../src/data/mockClients.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Migrando datos mock a la base de datos...');

  // Limpiar datos existentes
  await prisma.pago.deleteMany();
  await prisma.hamburguesa.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.client.deleteMany();

  console.log('✅ Base de datos limpiada');

  // Insertar clientes mock
  for (const mockClient of mockClients) {
    await prisma.client.create({
      data: {
        fechaInicial: mockClient.fechaInicial,
        mes: mockClient.mes,
        nombre: mockClient.nombre,
        activo: mockClient.activo,
        telefono: mockClient.telefono,
        porComida: mockClient.porComida,
        alDia: mockClient.alDia,
        porPedido: mockClient.porPedido,
        totalPorciones: mockClient.totalPorciones,
        duracionPedido: mockClient.duracionPedido,
        proximaEntrega: mockClient.proximaEntrega,
        valorKg: mockClient.valorKg,
        valorPedido: mockClient.valorPedido,
        direccion: mockClient.direccion,
        latitud: mockClient.coordenadas.lat,
        longitud: mockClient.coordenadas.lng,
        estadoCuenta: mockClient.estadoCuenta,
      },
    });
  }

  console.log(`✅ ${mockClients.length} clientes migrados exitosamente`);

  const clientCount = await prisma.client.count();
  console.log(`📊 Total de clientes en la base de datos: ${clientCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante la migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
