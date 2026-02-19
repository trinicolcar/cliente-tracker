import XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const prisma = new PrismaClient();

async function importFromXlsx() {
  try {
    // Leer el archivo Excel
    const workbook = XLSX.readFile('./src/resources/saldos y deudas vs clientes.xlsx');
    const sheetName = workbook.SheetNames[0]; // Primera hoja
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log('📊 Datos encontrados en el Excel:', data.length, 'filas');
    console.log('📋 Vista previa de la primera fila:', data[0]);
    
    // Mostrar las columnas disponibles
    if (data.length > 0) {
      console.log('📝 Columnas disponibles:', Object.keys(data[0] as Record<string, unknown>));
    }
    
    // Limpiar todas las tablas existentes
    console.log('\n🗑️  Limpiando datos existentes...');
    await prisma.pago.deleteMany();
    await prisma.hamburguesa.deleteMany();
    await prisma.delivery.deleteMany();
    await prisma.client.deleteMany();
    console.log('✅ Datos antiguos eliminados');
    
    // Importar clientes
    console.log('\n📥 Importando clientes...');
    let importedCount = 0;
    
    for (const row of data as any[]) {
      try {
        // Procesar coordenadas si existen
        let latitud = 0;
        let longitud = 0;
        if (row['Cordenadas']) {
          const coords = String(row['Cordenadas']).split(',').map(c => c.trim());
          if (coords.length === 2) {
            latitud = Number(coords[0]) || 0;
            longitud = Number(coords[1]) || 0;
          }
        }

        // Procesar fecha inicial de Excel (número de serie)
        let fechaInicial = new Date();
        if (row['FECHA INICIAL'] && row['FECHA INICIAL'] !== 0) {
          // Excel guarda fechas como números (días desde 1900-01-01)
          const excelDate = Number(row['FECHA INICIAL']);
          if (excelDate > 0) {
            fechaInicial = new Date((excelDate - 25569) * 86400 * 1000);
          }
        }

        // Procesar próxima entrega
        let proximaEntrega = new Date();
        if (row['PROXIMA  ENTREGA'] && row['PROXIMA  ENTREGA'] !== 0) {
          const excelDate = Number(row['PROXIMA  ENTREGA']);
          if (excelDate > 0) {
            proximaEntrega = new Date((excelDate - 25569) * 86400 * 1000);
          }
        }

        // Calcular teléfono desde los códigos
        const telefono = String(row['57'] || row['30'] || '');

        // Mapear las columnas del Excel a los campos de la base de datos
        const client = await prisma.client.create({
          data: {
            fechaInicial: fechaInicial,
            mes: row['MES'] || 'enero',
            nombre: row['NOMBRE2'] || row['NOMBRE'] || `Cliente ${importedCount + 1}`,
            activo: true,
            telefono: telefono,
            porComida: Number(row['POR COMIDA']) || 0,
            alDia: Number(row['AL DIA']) || 0,
            porPedido: Number(row['POR PEDIDO']) || 0,
            totalPorciones: Number(row['TOTAL PORCIONES']) || 0,
            duracionPedido: Number(row['DURACION DEL PEDIDO']) || 7,
            proximaEntrega: proximaEntrega,
            valorKg: Number(row[' VALOR KG ']) || 0,
            valorPedido: Number(row['gramos por pedido']) || 0,
            direccion: '',
            latitud: latitud,
            longitud: longitud,
            // El saldo a favor es positivo, la deuda es negativa
            estadoCuenta: ((Number(row['Deudas']) || 0) - Number(row['Saldos']) || 0 ),
          },
        });
        
        importedCount++;
        console.log(`✓ Cliente ${importedCount}: ${client.nombre}`);
      } catch (error) {
        console.error(`✗ Error importando fila ${importedCount + 1}:`, error);
      }
    }
    
    console.log(`\n✅ Importación completada: ${importedCount} clientes importados`);
    
  } catch (error) {
    console.error('❌ Error durante la importación:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la importación
importFromXlsx()
  .then(() => {
    console.log('\n🎉 Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
