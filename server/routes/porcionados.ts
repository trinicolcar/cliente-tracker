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

    // Do NOT create or update Porcionado rows here.
    // Instead, fetch any existing Porcionado rows for the date and merge
    // their estado (and id) into the aggregated items. The quantity
    // must come from the deliveries aggregation.
    const existingPorcionados = await prisma.porcionado.findMany({
      where: {
        fecha: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: { id: true, producto: true, gramaje: true, estado: true },
    });

    const merged = items.map((it) => {
      const match = existingPorcionados.find(
        (p) => p.producto === it.producto && Number(p.gramaje || 0) === Number(it.gramaje || 0)
      );
      return {
        // UI-friendly id: use existing porcionado id when available,
        // otherwise generate a synthetic id for rendering only
        id: match ? match.id : `agg-${it.producto}-${it.gramaje}`,
        producto: it.producto,
        gramaje: it.gramaje,
        cantidad: it.cantidad,
        fecha: toDayStart(fecha),
        estado: match ? (match.estado as 'pendiente' | 'porcionado') : 'pendiente',
        porcionadoId: match ? match.id : null,
      };
    });

    res.json(merged);
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

      // Debug logs to help diagnose consumption issues
      const availableGrams = barras.reduce((sum, b) => {
        return sum + Number(b.pesoGramos || 0) * Number(b.cantidad || 0);
      }, 0);
      console.log('Porcionado calc:', {
        porcionadoId: id,
        gramaje: target.gramaje,
        cantidad: target.cantidad,
        toAddGrams,
        alreadyUsedGrams,
        requiredGrams: alreadyUsedGrams + toAddGrams,
        availableGrams,
        barrasCount: barras.length,
      });

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

        console.log('Consuming barra', { barraId: barra.id, barraGrams, consumeGrams, newCantidad });

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

// POST mark: create porcionado row if missing, then mark as porcionado (consume barras)
porcionadosRouter.post('/mark', async (req, res) => {
  try {
    const { producto, gramaje, cantidad, fecha } = req.body || {};

    if (!producto || gramaje === undefined || cantidad === undefined || !fecha) {
      return res.status(400).json({ error: 'producto, gramaje, cantidad y fecha son requeridos' });
    }

    const range = buildDayRange(fecha);
    if (!range) return res.status(400).json({ error: 'Fecha inválida' });

    const dayStart = toDayStart(fecha);

    const result = await prisma.$transaction(async (tx) => {
      let target = await tx.porcionado.findFirst({
        where: {
          producto,
          gramaje: Number(gramaje),
          fecha: { gte: range.start, lte: range.end },
        },
      });

      if (!target) {
        target = await tx.porcionado.create({
          data: {
            producto,
            gramaje: Number(gramaje),
            cantidad: Number(cantidad),
            fecha: dayStart,
            estado: 'pendiente',
          },
        });
      } else {
        // ensure cantidad matches deliveries aggregation
        await tx.porcionado.update({ where: { id: target.id }, data: { cantidad: Number(cantidad) } });
        target = await tx.porcionado.findUnique({ where: { id: target.id } });
      }

      if (!target) throw new Error('Failed to create/find porcionado');

      if (target.estado === 'porcionado') {
        return target;
      }

      const existingPorcionados = await tx.porcionado.findMany({
        where: {
          estado: 'porcionado',
          fecha: { gte: range.start, lte: range.end },
          NOT: { id: target.id },
        },
        select: { gramaje: true, cantidad: true },
      });

      const alreadyUsedGrams = existingPorcionados.reduce((sum, p) => {
        return sum + Number(p.gramaje || 0) * Number(p.cantidad || 0);
      }, 0);

      const toAddGrams = Number(target.gramaje || 0) * Number(target.cantidad || 0);

      const barras = await tx.barra.findMany({
        where: { disponible: true },
        orderBy: { fechaProduccion: 'asc' },
        select: { id: true, pesoGramos: true, cantidad: true },
      });

      const availableGrams = barras.reduce((sum, b) => {
        return sum + Number(b.pesoGramos || 0) * Number(b.cantidad || 0);
      }, 0);

      const requiredGrams = alreadyUsedGrams + toAddGrams;
      if (requiredGrams > availableGrams) {
        const err: any = new Error('No hay suficiente material terminado para porcionar');
        err.status = 409;
        err.payload = { requiredGrams, availableGrams, shortageGrams: requiredGrams - availableGrams };
        throw err;
      }

      let remaining = toAddGrams;
      for (const barra of barras) {
        if (remaining <= 0) break;
        const barraGrams = Number(barra.pesoGramos || 0) * Number(barra.cantidad || 0);
        if (barraGrams <= 0) continue;
        const consumeGrams = Math.min(barraGrams, remaining);
        const newCantidad = (barraGrams - consumeGrams) / Number(barra.pesoGramos || 1);
        await tx.barra.update({ where: { id: barra.id }, data: { cantidad: newCantidad } });
        remaining -= consumeGrams;
      }

      if (remaining > 0) {
        const err: any = new Error('No hay suficiente material terminado para porcionar');
        err.status = 409;
        err.payload = { requiredGrams: toAddGrams, availableGrams, shortageGrams: remaining };
        throw err;
      }

      const updated = await tx.porcionado.update({ where: { id: target.id }, data: { estado: 'porcionado' } });
      return updated;
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error in mark porcionado:', error);
    if (error?.status === 409) {
      return res.status(409).json({ error: error.message, ...(error.payload || {}) });
    }
    res.status(500).json({ error: 'Failed to mark porcionado' });
  }
});
