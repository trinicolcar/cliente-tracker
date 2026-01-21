import { Router } from 'express';
import { prisma } from '../db';

export const pagosRouter = Router();

// GET all pagos
pagosRouter.get('/', async (req, res) => {
  try {
    const pagos = await prisma.pago.findMany({
      include: {
        client: true,
        delivery: true,
      },
      orderBy: {
        fechaPago: 'desc',
      },
    });

    res.json(pagos);
  } catch (error) {
    console.error('Error fetching pagos:', error);
    res.status(500).json({ error: 'Failed to fetch pagos' });
  }
});

// GET pagos by client ID
pagosRouter.get('/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const pagos = await prisma.pago.findMany({
      where: { clientId },
      include: {
        delivery: true,
      },
      orderBy: {
        fechaPago: 'desc',
      },
    });

    res.json(pagos);
  } catch (error) {
    console.error('Error fetching pagos:', error);
    res.status(500).json({ error: 'Failed to fetch pagos' });
  }
});

// GET pago by ID
pagosRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pago = await prisma.pago.findUnique({
      where: { id },
      include: {
        client: true,
        delivery: true,
      },
    });

    if (!pago) {
      return res.status(404).json({ error: 'Pago not found' });
    }

    res.json(pago);
  } catch (error) {
    console.error('Error fetching pago:', error);
    res.status(500).json({ error: 'Failed to fetch pago' });
  }
});

// CREATE new pago
pagosRouter.post('/', async (req, res) => {
  try {
    const data = req.body;

    const pago = await prisma.pago.create({
      data: {
        clientId: data.clientId,
        deliveryId: data.deliveryId,
        monto: data.monto,
        fechaPago: new Date(data.fechaPago),
        metodo: data.metodo,
        descripcion: data.descripcion,
      },
      include: {
        client: true,
        delivery: true,
      },
    });

    // Update client's estadoCuenta
    await prisma.client.update({
      where: { id: data.clientId },
      data: {
        estadoCuenta: {
          decrement: data.monto,
        },
      },
    });

    res.status(201).json(pago);
  } catch (error) {
    console.error('Error creating pago:', error);
    res.status(500).json({ error: 'Failed to create pago' });
  }
});

// UPDATE pago
pagosRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Get old pago to revert estadoCuenta
    const oldPago = await prisma.pago.findUnique({
      where: { id },
    });

    if (!oldPago) {
      return res.status(404).json({ error: 'Pago not found' });
    }

    // Update pago
    const pago = await prisma.pago.update({
      where: { id },
      data: {
        monto: data.monto,
        fechaPago: data.fechaPago ? new Date(data.fechaPago) : undefined,
        metodo: data.metodo,
        descripcion: data.descripcion,
      },
      include: {
        client: true,
        delivery: true,
      },
    });

    // Adjust estadoCuenta (revert old amount, apply new amount)
    const difference = data.monto - oldPago.monto;
    await prisma.client.update({
      where: { id: oldPago.clientId },
      data: {
        estadoCuenta: {
          decrement: difference,
        },
      },
    });

    res.json(pago);
  } catch (error) {
    console.error('Error updating pago:', error);
    res.status(500).json({ error: 'Failed to update pago' });
  }
});

// DELETE pago
pagosRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get pago to revert estadoCuenta
    const pago = await prisma.pago.findUnique({
      where: { id },
    });

    if (!pago) {
      return res.status(404).json({ error: 'Pago not found' });
    }

    // Delete pago
    await prisma.pago.delete({
      where: { id },
    });

    // Revert estadoCuenta
    await prisma.client.update({
      where: { id: pago.clientId },
      data: {
        estadoCuenta: {
          increment: pago.monto,
        },
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting pago:', error);
    res.status(500).json({ error: 'Failed to delete pago' });
  }
});
