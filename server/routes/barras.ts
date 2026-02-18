import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../db';

export const barrasRouter = Router();
const prismaClient: PrismaClient = prisma;

const buildDayRange = (dateString: string) => {
  const start = new Date(dateString);
  if (Number.isNaN(start.getTime())) {
    return null;
  }
  const end = new Date(start);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// GET all barras
barrasRouter.get('/', async (req, res) => {
  try {
    const { fecha, disponible } = req.query;

    const where: any = {};

    if (typeof disponible === 'string') {
      where.disponible = disponible === 'true';
    }

    if (typeof fecha === 'string') {
      const range = buildDayRange(fecha);
      if (!range) {
        return res.status(400).json({ error: 'Fecha inválida' });
      }
      where.fechaProduccion = {
        gte: range.start,
        lte: range.end,
      };
    }

    const barras = await prismaClient.barra.findMany({
      where,
      orderBy: { fechaProduccion: 'desc' },
    });

    res.json(barras);
  } catch (error) {
    console.error('Error fetching barras:', error);
    res.status(500).json({ error: 'Failed to fetch barras' });
  }
});

// CREATE barra
barrasRouter.post('/', async (req, res) => {
  try {
    const { pesoGramos, cantidad, fechaProduccion, disponible } = req.body || {};

    if (!pesoGramos || !cantidad || !fechaProduccion) {
      return res.status(400).json({ error: 'pesoGramos, cantidad y fechaProduccion son requeridos' });
    }

    const barra = await prismaClient.barra.create({
      data: {
        pesoGramos: Number(pesoGramos),
        cantidad: Number(cantidad),
        fechaProduccion: new Date(fechaProduccion),
        disponible: disponible ?? true,
      },
    });

    res.status(201).json(barra);
  } catch (error) {
    console.error('Error creating barra:', error);
    res.status(500).json({ error: 'Failed to create barra' });
  }
});

// UPDATE barra
barrasRouter.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { pesoGramos, cantidad, fechaProduccion, disponible } = req.body || {};

    const barra = await prismaClient.barra.update({
      where: { id },
      data: {
        pesoGramos: pesoGramos !== undefined ? Number(pesoGramos) : undefined,
        cantidad: cantidad !== undefined ? Number(cantidad) : undefined,
        fechaProduccion: fechaProduccion ? new Date(fechaProduccion) : undefined,
        disponible: disponible !== undefined ? Boolean(disponible) : undefined,
      },
    });

    res.json(barra);
  } catch (error) {
    console.error('Error updating barra:', error);
    res.status(500).json({ error: 'Failed to update barra' });
  }
});

// DELETE barra
barrasRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prismaClient.barra.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting barra:', error);
    res.status(500).json({ error: 'Failed to delete barra' });
  }
});

// GET stock summary
barrasRouter.get('/stock/summary', async (req, res) => {
  try {
    const { hasta } = req.query;
    const where: any = { disponible: true };

    if (typeof hasta === 'string') {
      const range = buildDayRange(hasta);
      if (!range) {
        return res.status(400).json({ error: 'Fecha inválida' });
      }
      where.fechaProduccion = { lte: range.end };
    }

    const barras = await prismaClient.barra.findMany({
      where,
      select: { pesoGramos: true, cantidad: true },
    });

    const availableGrams = barras.reduce((sum: number, b: { pesoGramos: number; cantidad: number }) => {
      return sum + b.pesoGramos * b.cantidad;
    }, 0);

    res.json({ availableGrams });
  } catch (error) {
    console.error('Error fetching stock summary:', error);
    res.status(500).json({ error: 'Failed to fetch stock summary' });
  }
});

// GET availability for a date
barrasRouter.get('/availability', async (req, res) => {
  try {
    const { fecha } = req.query;

    if (typeof fecha !== 'string') {
      return res.status(400).json({ error: 'fecha es requerida (YYYY-MM-DD)' });
    }

    const range = buildDayRange(fecha);
    if (!range) {
      return res.status(400).json({ error: 'Fecha inválida' });
    }

    const deliveries = await prisma.delivery.findMany({
      where: {
        fecha: {
          gte: range.start,
          lte: range.end,
        },
      },
      include: {
        hamburguesas: true,
      },
    });

    const requiredGrams = deliveries.reduce((total, delivery) => {
      const grams = delivery.hamburguesas.reduce((sum, h) => {
        const gramaje = h.gramaje ?? 0;
        return sum + gramaje * h.cantidad;
      }, 0);
      return total + grams;
    }, 0);

    const barras = await prismaClient.barra.findMany({
      where: {
        disponible: true,
        fechaProduccion: {
          lte: range.end,
        },
      },
      select: { pesoGramos: true, cantidad: true },
    });

    const availableGrams = barras.reduce((sum: number, b: { pesoGramos: number; cantidad: number }) => {
      return sum + b.pesoGramos * b.cantidad;
    }, 0);
    const shortageGrams = Math.max(0, requiredGrams - availableGrams);

    res.json({
      fecha,
      requiredGrams,
      availableGrams,
      shortageGrams,
      ok: shortageGrams === 0,
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});
