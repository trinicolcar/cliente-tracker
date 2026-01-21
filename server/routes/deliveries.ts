import { Router } from 'express';
import { prisma } from '../db';

export const deliveriesRouter = Router();

// GET all deliveries
deliveriesRouter.get('/', async (req, res) => {
  try {
    const deliveries = await prisma.delivery.findMany({
      include: {
        hamburguesas: true,
        client: true,
        pagos: true,
      },
      orderBy: {
        fecha: 'desc',
      },
    });

    const transformedDeliveries = deliveries.map((delivery: any) => ({
      id: delivery.id,
      clientId: delivery.clientId,
      fecha: delivery.fecha,
      hamburguesas: delivery.hamburguesas.map((h: any) => ({
        id: h.id,
        cantidad: h.cantidad,
        gramaje: h.gramaje,
        descripcion: h.descripcion,
      })),
      precioTotal: delivery.precioTotal,
      createdAt: delivery.createdAt,
    }));

    res.json(transformedDeliveries);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

// GET deliveries by client ID
deliveriesRouter.get('/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const deliveries = await prisma.delivery.findMany({
      where: { clientId },
      include: {
        hamburguesas: true,
        pagos: true,
      },
      orderBy: {
        fecha: 'desc',
      },
    });

    const transformedDeliveries = deliveries.map((delivery: any) => ({
      id: delivery.id,
      clientId: delivery.clientId,
      fecha: delivery.fecha,
      hamburguesas: delivery.hamburguesas.map((h: any) => ({
        id: h.id,
        cantidad: h.cantidad,
        gramaje: h.gramaje,
        descripcion: h.descripcion,
      })),
      precioTotal: delivery.precioTotal,
      createdAt: delivery.createdAt,
    }));

    res.json(transformedDeliveries);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

// GET delivery by ID
deliveriesRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        hamburguesas: true,
        client: true,
        pagos: true,
      },
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    const transformedDelivery = {
      id: delivery.id,
      clientId: delivery.clientId,
      fecha: delivery.fecha,
      hamburguesas: delivery.hamburguesas.map((h: any) => ({
        id: h.id,
        cantidad: h.cantidad,
        gramaje: h.gramaje,
        descripcion: h.descripcion,
      })),
      precioTotal: delivery.precioTotal,
      createdAt: delivery.createdAt,
    };

    res.json(transformedDelivery);
  } catch (error) {
    console.error('Error fetching delivery:', error);
    res.status(500).json({ error: 'Failed to fetch delivery' });
  }
});

// CREATE new delivery
deliveriesRouter.post('/', async (req, res) => {
  try {
    const data = req.body;

    const delivery = await prisma.delivery.create({
      data: {
        clientId: data.clientId,
        fecha: new Date(data.fecha),
        precioTotal: data.precioTotal,
        hamburguesas: {
          create: data.hamburguesas.map((h: any) => ({
            cantidad: h.cantidad,
            gramaje: h.gramaje,
            descripcion: h.descripcion,
          })),
        },
      },
      include: {
        hamburguesas: true,
      },
    });

    const transformedDelivery = {
      id: delivery.id,
      clientId: delivery.clientId,
      fecha: delivery.fecha,
      hamburguesas: delivery.hamburguesas.map((h: any) => ({
        id: h.id,
        cantidad: h.cantidad,
        gramaje: h.gramaje,
        descripcion: h.descripcion,
      })),
      precioTotal: delivery.precioTotal,
      createdAt: delivery.createdAt,
    };

    res.status(201).json(transformedDelivery);
  } catch (error) {
    console.error('Error creating delivery:', error);
    res.status(500).json({ error: 'Failed to create delivery' });
  }
});

// UPDATE delivery
deliveriesRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Delete existing hamburguesas and create new ones
    await prisma.hamburguesa.deleteMany({
      where: { deliveryId: id },
    });

    const delivery = await prisma.delivery.update({
      where: { id },
      data: {
        fecha: data.fecha ? new Date(data.fecha) : undefined,
        precioTotal: data.precioTotal,
        hamburguesas: {
          create: data.hamburguesas?.map((h: any) => ({
            cantidad: h.cantidad,
            gramaje: h.gramaje,
            descripcion: h.descripcion,
          })),
        },
      },
      include: {
        hamburguesas: true,
      },
    });

    const transformedDelivery = {
      id: delivery.id,
      clientId: delivery.clientId,
      fecha: delivery.fecha,
      hamburguesas: delivery.hamburguesas.map((h: any) => ({
        id: h.id,
        cantidad: h.cantidad,
        gramaje: h.gramaje,
        descripcion: h.descripcion,
      })),
      precioTotal: delivery.precioTotal,
      createdAt: delivery.createdAt,
    };

    res.json(transformedDelivery);
  } catch (error) {
    console.error('Error updating delivery:', error);
    res.status(500).json({ error: 'Failed to update delivery' });
  }
});

// DELETE delivery
deliveriesRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.delivery.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting delivery:', error);
    res.status(500).json({ error: 'Failed to delete delivery' });
  }
});
