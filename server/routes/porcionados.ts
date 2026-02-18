import { Router } from 'express';
import { prisma } from '../db';

export const porcionadosRouter = Router();

const parseLocalDate = (dateString: string) => {
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const buildDayRange = (dateString: string) => {
  const start = parseLocalDate(dateString);
  if (!start) {
    return null;
  }
  const end = new Date(start);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const toDayStart = (dateString: string) => {
  const d = parseLocalDate(dateString) || new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const buildDayRangeFromDate = (date: Date) => {
  const start = new Date(date);
  const end = new Date(date);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// GET porcionados for a date (creates missing rows from deliveries)
porcionadosRouter.get('/', async (req, res) => {
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
      include: { hamburguesas: true },
    });

    const aggregated = new Map<string, { producto: string; gramaje: number; cantidad: number }>();

    deliveries.forEach((delivery) => {
      delivery.hamburguesas.forEach((h) => {
        const producto = h.tipo || 'hamburguesa';
        const gramaje = Number(h.gramaje || 0);
        const cantidad = Number(h.cantidad || 0);
        const key = `${producto}-${gramaje}`;
        const current = aggregated.get(key);
        if (current) {
          current.cantidad += cantidad;
        } else {
          aggregated.set(key, { producto, gramaje, cantidad });
        }
      });
    });

    const items = Array.from(aggregated.values());

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const existing = await tx.porcionado.findFirst({
          where: {
            producto: item.producto,
            gramaje: item.gramaje,
            fecha: {
              gte: range.start,
              lte: range.end,
            },
          },
        });

        if (existing) {
          if (existing.estado === 'porcionado') {
            if (item.cantidad > existing.cantidad) {
              const diff = item.cantidad - existing.cantidad;
              await tx.porcionado.create({
                data: {
                  producto: item.producto,
                  gramaje: item.gramaje,
                  cantidad: diff,
                  fecha: toDayStart(fecha),
                  estado: 'pendiente',
                },
              });
            }
          } else {
            await tx.porcionado.update({
              where: { id: existing.id },
              data: {
                cantidad: item.cantidad,
              },
            });
          }
        } else {
          await tx.porcionado.create({
            data: {
              producto: item.producto,
              gramaje: item.gramaje,
              cantidad: item.cantidad,
              fecha: toDayStart(fecha),
              estado: 'pendiente',
            },
          });
        }
      }
    });

    const porcionados = await prisma.porcionado.findMany({
      where: {
        fecha: {
          gte: range.start,
          lte: range.end,
        },
      },
      orderBy: { gramaje: 'asc' },
    });

    res.json(porcionados);
  } catch (error) {
    console.error('Error fetching porcionados:', error);
    res.status(500).json({ error: 'Failed to fetch porcionados' });
  }
});

// PATCH porcionado status
porcionadosRouter.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, fecha } = req.body || {};

    if (!estado) {
      return res.status(400).json({ error: 'estado es requerido' });
    }

    const target = await prisma.porcionado.findUnique({ where: { id } });
    if (!target) {
      return res.status(404).json({ error: 'Porcionado no encontrado' });
    }

    if (estado === 'pendiente' && target.estado === 'porcionado') {
      return res.status(400).json({ error: 'No se puede desmarcar un porcionado' });
    }

    if (estado === 'porcionado' && target.estado !== 'porcionado') {
      const range = buildDayRangeFromDate(target.fecha);

      const existingPorcionados = await prisma.porcionado.findMany({
        where: {
          estado: 'porcionado',
          fecha: {
            gte: range.start,
            lte: range.end,
          },
          NOT: { id },
        },
        select: { gramaje: true, cantidad: true },
      });

      const alreadyUsedGrams = existingPorcionados.reduce((sum, p) => {
        return sum + Number(p.gramaje || 0) * Number(p.cantidad || 0);
      }, 0);

      const toAddGrams = Number(target.gramaje || 0) * Number(target.cantidad || 0);

      const barras = await prisma.barra.findMany({
        where: {
          disponible: true,
        },
        orderBy: { fechaProduccion: 'asc' },
        select: { id: true, pesoGramos: true, cantidad: true },
      });

      const availableGrams = barras.reduce((sum, b) => {
        return sum + Number(b.pesoGramos || 0) * Number(b.cantidad || 0);
      }, 0);

      const requiredGrams = alreadyUsedGrams + toAddGrams;

      if (requiredGrams > availableGrams) {
        return res.status(409).json({
          error: 'No hay suficiente material terminado para porcionar',
          requiredGrams,
          availableGrams,
          shortageGrams: requiredGrams - availableGrams,
        });
      }

      let remaining = toAddGrams;

      for (const barra of barras) {
        if (remaining <= 0) break;

        const barraGrams = Number(barra.pesoGramos || 0) * Number(barra.cantidad || 0);
        if (barraGrams <= 0) continue;

        const consumeGrams = Math.min(barraGrams, remaining);
        const newCantidad = (barraGrams - consumeGrams) / Number(barra.pesoGramos || 1);

        await prisma.barra.update({
          where: { id: barra.id },
          data: { cantidad: newCantidad },
        });

        remaining -= consumeGrams;
      }

      if (remaining > 0) {
        return res.status(409).json({
          error: 'No hay suficiente material terminado para porcionar',
          requiredGrams: toAddGrams,
          availableGrams,
          shortageGrams: remaining,
        });
      }
    }

    const updated = await prisma.porcionado.update({
      where: { id },
      data: {
        estado,
        fecha: typeof fecha === 'string' ? toDayStart(fecha) : undefined,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating porcionado:', error);
    res.status(500).json({ error: 'Failed to update porcionado' });
  }
});
