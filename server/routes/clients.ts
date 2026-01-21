import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../db';

export const clientsRouter = Router();

// Configurar multer para archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

// GET all clients
clientsRouter.get('/', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        deliveries: {
          include: {
            hamburguesas: true,
          },
        },
        pagos: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to match frontend format
    const transformedClients = clients.map((client: any) => ({
      id: client.id,
      fechaInicial: client.fechaInicial,
      mes: client.mes,
      nombre: client.nombre,
      activo: client.activo,
      telefono: client.telefono,
      porComida: client.porComida,
      alDia: client.alDia,
      porPedido: client.porPedido,
      totalPorciones: client.totalPorciones,
      duracionPedido: client.duracionPedido,
      proximaEntrega: client.proximaEntrega,
      valorKg: client.valorKg,
      valorPedido: client.valorPedido,
      direccion: client.direccion,
      coordenadas: {
        lat: client.latitud,
        lng: client.longitud,
      },
      estadoCuenta: client.estadoCuenta,
    }));

    res.json(transformedClients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET client by ID
clientsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        deliveries: {
          include: {
            hamburguesas: true,
          },
        },
        pagos: true,
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const transformedClient = {
      id: client.id,
      fechaInicial: client.fechaInicial,
      mes: client.mes,
      nombre: client.nombre,
      activo: client.activo,
      telefono: client.telefono,
      porComida: client.porComida,
      alDia: client.alDia,
      porPedido: client.porPedido,
      totalPorciones: client.totalPorciones,
      duracionPedido: client.duracionPedido,
      proximaEntrega: client.proximaEntrega,
      valorKg: client.valorKg,
      valorPedido: client.valorPedido,
      direccion: client.direccion,
      coordenadas: {
        lat: client.latitud,
        lng: client.longitud,
      },
      estadoCuenta: client.estadoCuenta,
    };

    res.json(transformedClient);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// CREATE new client
clientsRouter.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    const client = await prisma.client.create({
      data: {
        fechaInicial: new Date(data.fechaInicial),
        mes: data.mes,
        nombre: data.nombre,
        activo: data.activo ?? true,
        telefono: data.telefono,
        porComida: data.porComida,
        alDia: data.alDia,
        porPedido: data.porPedido,
        totalPorciones: data.totalPorciones,
        duracionPedido: data.duracionPedido,
        proximaEntrega: new Date(data.proximaEntrega),
        valorKg: data.valorKg,
        valorPedido: data.valorPedido,
        direccion: data.direccion,
        latitud: data.coordenadas.lat,
        longitud: data.coordenadas.lng,
        estadoCuenta: data.estadoCuenta ?? 0,
      },
    });

    const transformedClient = {
      id: client.id,
      fechaInicial: client.fechaInicial,
      mes: client.mes,
      nombre: client.nombre,
      activo: client.activo,
      telefono: client.telefono,
      porComida: client.porComida,
      alDia: client.alDia,
      porPedido: client.porPedido,
      totalPorciones: client.totalPorciones,
      duracionPedido: client.duracionPedido,
      proximaEntrega: client.proximaEntrega,
      valorKg: client.valorKg,
      valorPedido: client.valorPedido,
      direccion: client.direccion,
      coordenadas: {
        lat: client.latitud,
        lng: client.longitud,
      },
      estadoCuenta: client.estadoCuenta,
    };

    res.status(201).json(transformedClient);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// UPDATE client
clientsRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const client = await prisma.client.update({
      where: { id },
      data: {
        fechaInicial: data.fechaInicial ? new Date(data.fechaInicial) : undefined,
        mes: data.mes,
        nombre: data.nombre,
        activo: data.activo,
        telefono: data.telefono,
        porComida: data.porComida,
        alDia: data.alDia,
        porPedido: data.porPedido,
        totalPorciones: data.totalPorciones,
        duracionPedido: data.duracionPedido,
        proximaEntrega: data.proximaEntrega ? new Date(data.proximaEntrega) : undefined,
        valorKg: data.valorKg,
        valorPedido: data.valorPedido,
        direccion: data.direccion,
        latitud: data.coordenadas?.lat,
        longitud: data.coordenadas?.lng,
        estadoCuenta: data.estadoCuenta,
      },
    });

    const transformedClient = {
      id: client.id,
      fechaInicial: client.fechaInicial,
      mes: client.mes,
      nombre: client.nombre,
      activo: client.activo,
      telefono: client.telefono,
      porComida: client.porComida,
      alDia: client.alDia,
      porPedido: client.porPedido,
      totalPorciones: client.totalPorciones,
      duracionPedido: client.duracionPedido,
      proximaEntrega: client.proximaEntrega,
      valorKg: client.valorKg,
      valorPedido: client.valorPedido,
      direccion: client.direccion,
      coordenadas: {
        lat: client.latitud,
        lng: client.longitud,
      },
      estadoCuenta: client.estadoCuenta,
    };

    res.json(transformedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// DELETE client
clientsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.client.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// BULK CREATE clients from CSV
clientsRouter.post('/bulk', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV file is empty or invalid' });
    }

    // Parse CSV (asumiendo formato: nombre,telefono,direccion,lat,lng,porComida,alDia,duracionPedido,valorKg)
    const headers = lines[0].split(',').map(h => h.trim());
    const clients = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length < 9) {
          errors.push({ line: i + 1, error: 'Incomplete data' });
          continue;
        }

        const [nombre, telefono, direccion, lat, lng, porComida, alDia, duracionPedido, valorKg] = values;
        
        const porComidaNum = parseInt(porComida);
        const alDiaNum = parseInt(alDia);
        const duracionPedidoNum = parseInt(duracionPedido);
        const valorKgNum = parseFloat(valorKg);
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);

        const porPedido = porComidaNum * alDiaNum * duracionPedidoNum;
        const totalPorciones = porPedido * 2; // Asumiendo 2 porciones por hamburguesa
        const valorPedido = (totalPorciones * valorKgNum) / 1000 * 125; // Asumiendo 125g por porción

        const client = await prisma.client.create({
          data: {
            fechaInicial: new Date(),
            mes: new Date().toLocaleDateString('es-ES', { month: 'long' }),
            nombre,
            activo: true,
            telefono,
            porComida: porComidaNum,
            alDia: alDiaNum,
            porPedido,
            totalPorciones,
            duracionPedido: duracionPedidoNum,
            proximaEntrega: new Date(Date.now() + duracionPedidoNum * 24 * 60 * 60 * 1000),
            valorKg: valorKgNum,
            valorPedido,
            direccion,
            latitud: latNum,
            longitud: lngNum,
            estadoCuenta: 0,
          },
        });

        clients.push(client);
      } catch (error) {
        errors.push({ line: i + 1, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    res.json({
      success: true,
      created: clients.length,
      errors: errors.length,
      errorDetails: errors,
      clients: clients.map(client => ({
        id: client.id,
        nombre: client.nombre,
        telefono: client.telefono,
      })),
    });
  } catch (error) {
    console.error('Error bulk creating clients:', error);
    res.status(500).json({ error: 'Failed to bulk create clients' });
  }
});
