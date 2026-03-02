import { Router } from 'express';
import { prisma } from '../db';
import PDFDocument from 'pdfkit';

export const deliveriesRouter = Router();

// GET all deliveries
deliveriesRouter.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const where: any = {};

    const parseLocalDate = (value: string) => {
      const [year, month, day] = value.split('T')[0].split('-').map(Number);
      const date = new Date(year, (month || 1) - 1, day || 1);
      if (Number.isNaN(date.getTime())) return null;
      return date;
    };

    if (startDate || endDate) {
      const start = startDate ? parseLocalDate(startDate) : null;
      const end = endDate ? parseLocalDate(endDate) : null;

      if ((startDate && !start) || (endDate && !end)) {
        return res.status(400).json({ error: 'Fechas inválidas' });
      }

      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);

      where.fecha = {
        ...(start ? { gte: start } : {}),
        ...(end ? { lte: end } : {}),
      };
    }

    const deliveries = await prisma.delivery.findMany({
      where,
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
        tipo: h.tipo,
        cantidad: h.cantidad,
        gramaje: h.gramaje,
        precio: h.precio,
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
        tipo: h.tipo,
        cantidad: h.cantidad,
        gramaje: h.gramaje,
        precio: h.precio,
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
// GET invoice for a delivery
deliveriesRouter.get('/:id/invoice', async (req, res) => {
  try {
    const { id } = req.params;
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { hamburguesas: true, client: true, pagos: true },
    });

    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

    const pagos = (delivery.pagos || []).map((p: any) => ({
      id: p.id,
      monto: p.monto,
      fechaPago: p.fechaPago,
      metodo: p.metodo,
    }));

    const totalPagos = pagos.reduce((s: number, p: any) => s + (p.monto || 0), 0);

    const invoice = {
      deliveryId: delivery.id,
      fecha: delivery.fecha,
      client: {
        id: delivery.client.id,
        nombre: delivery.client.nombre,
        telefono: delivery.client.telefono,
        direccion: delivery.client.direccion,
      },
      items: delivery.hamburguesas.map((h: any) => ({
        id: h.id,
        tipo: h.tipo,
        cantidad: h.cantidad,
        gramaje: h.gramaje,
        precio: h.precio,
        descripcion: h.descripcion,
      })),
      subtotal: delivery.precioTotal,
      pagos,
      balanceDue: (delivery.precioTotal || 0) - totalPagos,
    };

    res.json(invoice);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// GET invoice PDF for a delivery
deliveriesRouter.get('/:id/invoice.pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { hamburguesas: true, client: true, pagos: true },
    });

    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

    const pagos = (delivery.pagos || []).map((p: any) => ({
      id: p.id,
      monto: p.monto,
      fechaPago: p.fechaPago,
      metodo: p.metodo,
    }));

    const totalPagos = pagos.reduce((s: number, p: any) => s + (p.monto || 0), 0);

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${delivery.id}.pdf"`);

    doc.fontSize(20).text('Factura', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Entrega ID: ${delivery.id}`);
    doc.text(`Fecha: ${new Date(delivery.fecha).toLocaleString()}`);
    doc.moveDown();

    doc.text(`Cliente: ${delivery.client.nombre}`);
    if (delivery.client.direccion) doc.text(`Dirección: ${delivery.client.direccion}`);
    if (delivery.client.telefono) doc.text(`Teléfono: ${delivery.client.telefono}`);
    doc.moveDown();

    doc.text('Items:');
    doc.moveDown(0.5);
    const tableTop = doc.y;
    doc.fontSize(10);
    doc.text('Descripción', 50, tableTop);
    doc.text('Cantidad', 300, tableTop);
    doc.text('Gramaje', 380, tableTop);
    doc.moveDown();

    delivery.hamburguesas.forEach((h: any) => {
      doc.text(h.descripcion || '-', 50, doc.y);
      doc.text(String(h.cantidad), 300, doc.y);
      doc.text(h.gramaje ? `${h.gramaje}g` : '-', 380, doc.y);
      doc.moveDown();
    });

    doc.moveDown();
    doc.text(`Subtotal: ${delivery.precioTotal}` , { align: 'right' });
    doc.text(`Pagos: ${totalPagos}`, { align: 'right' });
    doc.text(`Saldo pendiente: ${ (delivery.precioTotal || 0) - totalPagos }`, { align: 'right' });

    doc.end();
    doc.pipe(res);
  } catch (error) {
    console.error('Error generating PDF invoice:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
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
        tipo: h.tipo,
        cantidad: h.cantidad,
        gramaje: h.gramaje,
        precio: h.precio,
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

    const delivery = await prisma.$transaction(async (tx) => {
      const created = await tx.delivery.create({
        data: {
          clientId: data.clientId,
          fecha: new Date(data.fecha),
          precioTotal: data.precioTotal,
          hamburguesas: {
            create: data.hamburguesas.map((h: any) => ({
              tipo: h.tipo || 'hamburguesa',
              cantidad: h.cantidad,
              gramaje: h.gramaje,
              precio: h.precio || null,
              descripcion: h.descripcion,              estado: h.estado || 'pendiente',            })),
          },
        },
        include: {
          hamburguesas: true,
        },
      });

      if (created.precioTotal && created.clientId) {
        await tx.client.update({
          where: { id: created.clientId },
          data: {
            estadoCuenta: {
              increment: created.precioTotal,
            },
          },
        });
      }

      return created;
    });

    const transformedDelivery = {
      id: delivery.id,
      clientId: delivery.clientId,
      fecha: delivery.fecha,
      hamburguesas: delivery.hamburguesas.map((h: any) => ({
        id: h.id,
        tipo: h.tipo,
        cantidad: h.cantidad,
        gramaje: h.gramaje,
        precio: h.precio,
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

// PATCH delivery (reschedule only)
deliveriesRouter.patch('/:id/reschedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha } = req.body;

    if (!fecha) {
      return res.status(400).json({ error: 'Nueva fecha requerida' });
    }

    const delivery = await prisma.delivery.update({
      where: { id },
      data: {
        fecha: new Date(fecha),
      },
      include: {
        hamburguesas: true,
        client: true,
      },
    });

    res.json({
      id: delivery.id,
      clientId: delivery.clientId,
      fecha: delivery.fecha,
      hamburguesas: delivery.hamburguesas.map((h: any) => ({
        id: h.id,
        tipo: h.tipo,
        cantidad: h.cantidad,
        gramaje: h.gramaje,
        precio: h.precio,
        descripcion: h.descripcion,
      })),
      precioTotal: delivery.precioTotal,
      createdAt: delivery.createdAt,
    });
  } catch (error) {
    console.error('Error rescheduling delivery:', error);
    res.status(500).json({ error: 'Failed to reschedule delivery' });
  }
});

// UPDATE delivery
deliveriesRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const delivery = await prisma.$transaction(async (tx) => {
      const oldDelivery = await tx.delivery.findUnique({ where: { id } });

      await tx.hamburguesa.deleteMany({ where: { deliveryId: id } });

      const updated = await tx.delivery.update({
        where: { id },
        data: {
          fecha: data.fecha ? new Date(data.fecha) : undefined,
          precioTotal: data.precioTotal,
          hamburguesas: {
            create: data.hamburguesas?.map((h: any) => ({
              tipo: h.tipo || 'hamburguesa',
              cantidad: h.cantidad,
              gramaje: h.gramaje,
              precio: h.precio || null,
              descripcion: h.descripcion,
              estado: h.estado || 'pendiente',
            })),
          },
        },
        include: {
          hamburguesas: true,
        },
      });

      const oldAmount = oldDelivery?.precioTotal ?? 0;
      const newAmount = updated.precioTotal ?? 0;

      if (oldDelivery && oldDelivery.clientId !== updated.clientId) {
        // revert old client
        if (oldAmount) {
          await tx.client.update({
            where: { id: oldDelivery.clientId },
            data: { estadoCuenta: { decrement: oldAmount } },
          });
        }
        // increment new client
        if (newAmount) {
          await tx.client.update({
            where: { id: updated.clientId },
            data: { estadoCuenta: { increment: newAmount } },
          });
        }
      } else {
        const diff = newAmount - oldAmount;
        if (diff !== 0 && updated.clientId) {
          await tx.client.update({
            where: { id: updated.clientId },
            data: { estadoCuenta: { increment: diff } },
          });
        }
      }

      return updated;
    });

    const transformedDelivery = {
      id: delivery.id,
      clientId: delivery.clientId,
      fecha: delivery.fecha,
      hamburguesas: delivery.hamburguesas.map((h: any) => ({
        id: h.id,
        tipo: h.tipo,
        cantidad: h.cantidad,
        gramaje: h.gramaje,
        precio: h.precio,
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
    await prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.findUnique({ where: { id } });

      if (!delivery) {
        throw new Error('NOT_FOUND');
      }

      await tx.delivery.delete({ where: { id } });

      if (delivery.clientId && delivery.precioTotal) {
        await tx.client.update({
          where: { id: delivery.clientId },
          data: { estadoCuenta: { decrement: delivery.precioTotal } },
        });
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting delivery:', error);
    res.status(500).json({ error: 'Failed to delete delivery' });
  }
});

