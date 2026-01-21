import { prisma } from './db';

async function testConnection() {
  try {
    console.log('🔍 Probando conexión...');
    
    // Test: Crear un cliente
    const testClient = await prisma.client.create({
      data: {
        fechaInicial: new Date('2024-01-15'),
        mes: 'Enero',
        nombre: 'María García López',
        activo: true,
        telefono: '+57 300 123 4567',
        porComida: 2,
        alDia: 4,
        porPedido: 28,
        totalPorciones: 56,
        duracionPedido: 14,
        proximaEntrega: new Date('2024-02-01'),
        valorKg: 25000,
        valorPedido: 350000,
        direccion: 'Calle 45 #12-34, Bogotá',
        latitud: 4.6097,
        longitud: -74.0817,
        estadoCuenta: 0,
      },
    });

    console.log('✅ Cliente creado:', testClient.nombre);

    // Test: Leer clientes
    const clients = await prisma.client.findMany();
    console.log(`✅ Total de clientes: ${clients.length}`);

    console.log('🎉 Conexión exitosa!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
