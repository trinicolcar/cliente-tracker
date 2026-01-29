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

      const pago = await prisma.$transaction(async (tx) => {
        const created = await tx.pago.create({
          data: {
            clientId: data.clientId,
            deliveryId: data.deliveryId || null,
            monto: data.monto,
            fechaPago: new Date(data.fechaPago),
            metodo: data.metodo,
            descripcion: data.descripcion || null,
          },
          include: {
            client: true,
            delivery: true,
          },
        });

        // Update client's estadoCuenta (always decrement by monto)
        await tx.client.update({
          where: { id: data.clientId },
          data: { estadoCuenta: { decrement: data.monto } },
        });

        return created;
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

    // Update pago inside a transaction and adjust estadoCuenta accordingly
    const pago = await prisma.$transaction(async (tx) => {
      const updated = await tx.pago.update({
        where: { id },
        data: {
          monto: data.monto,
          fechaPago: data.fechaPago ? new Date(data.fechaPago) : undefined,
          metodo: data.metodo,
          descripcion: data.descripcion,
          deliveryId: data.deliveryId === undefined ? undefined : data.deliveryId,
        },
        include: {
          client: true,
          delivery: true,
        },
      });

      const difference = data.monto - oldPago.monto;
      if (difference !== 0) {
        await tx.client.update({
          where: { id: oldPago.clientId },
          data: { estadoCuenta: { decrement: difference } },
        });
      }

      return updated;
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
    
    // Delete pago and revert estadoCuenta inside a transaction
    await prisma.$transaction(async (tx) => {
      const pago = await tx.pago.findUnique({ where: { id } });
      if (!pago) {
        throw new Error('NOT_FOUND');
      }

      await tx.pago.delete({ where: { id } });

      await tx.client.update({
        where: { id: pago.clientId },
        data: { estadoCuenta: { increment: pago.monto } },
      });
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting pago:', error);
    res.status(500).json({ error: 'Failed to delete pago' });
  }
});
