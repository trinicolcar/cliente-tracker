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

// GET porcionados for a date (aggregates from deliveries/hamburguesas)
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

    // Get all hamburguesas from deliveries for this date
    const deliveries = await prisma.delivery.findMany({
      where: {
        fecha: {
          gte: range.start,
          lte: range.end,
        },
      },
      include: { hamburguesas: true },
    });

    // Aggregate hamburguesas by producto and gramaje
    const aggregated = new Map<string, { producto: string; gramaje: number; cantidad: number; estado: string }>();

    deliveries.forEach((delivery) => {
      delivery.hamburguesas.forEach((h) => {
        const producto = h.tipo || 'hamburguesa';
        const gramaje = Number(h.gramaje || 0);
        const cantidad = Number(h.cantidad || 0);
        const key = `${producto}-${gramaje}`;
        const current = aggregated.get(key);
        
        if (current) {
          current.cantidad += cantidad;
          // If any hamburguesa in this group is porcionado, mark the whole group as porcionado
          if (h.estado === 'porcionado') {
            current.estado = 'porcionado';
          }
        } else {
          aggregated.set(key, { 
            producto, 
            gramaje, 
            cantidad, 
            estado: h.estado || 'pendiente'
          });
        }
      });
    });

    const items = Array.from(aggregated.values()).map((it) => ({
      id: `${it.producto}-${it.gramaje}`,
      producto: it.producto,
      gramaje: it.gramaje,
      cantidad: it.cantidad,
      fecha: toDayStart(fecha),
      estado: it.estado as 'pendiente' | 'porcionado',
    }));

    res.json(items);
  } catch (error) {
    console.error('Error fetching porcionados:', error);
    res.status(500).json({ error: 'Failed to fetch porcionados' });
  }
});

// PATCH porcionado status - updates all hamburguesas matching producto and gramaje
porcionadosRouter.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, fecha } = req.body || {};

    if (!estado) {
      return res.status(400).json({ error: 'estado es requerido' });
    }

    // Parse id to get producto and gramaje (format: "producto-gramaje")
    const parts = id.split('-');
    if (parts.length < 2) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Reconstruct producto (may contain hyphens) and gramaje
    const gramaje = parseFloat(parts[parts.length - 1]);
    const producto = parts.slice(0, -1).join('-');
    
    if (isNaN(gramaje)) {
      return res.status(400).json({ error: 'ID inválido: gramaje no es un número' });
    }

    const range = buildDayRange(typeof fecha === 'string' ? fecha : new Date().toISOString());
    if (!range) {
      return res.status(400).json({ error: 'Fecha inválida' });
    }

    // Check current state
    const deliveries = await prisma.delivery.findMany({
      where: {
        fecha: {
          gte: range.start,
          lte: range.end,
        },
      },
      include: { hamburguesas: true },
    });

    const relevantHamburguesas = deliveries.flatMap(d => 
      d.hamburguesas.filter(h => 
        (h.tipo || 'hamburguesa') === producto && 
        Number(h.gramaje || 0) === gramaje
      )
    );

    if (relevantHamburguesas.length === 0) {
      return res.status(404).json({ error: 'No hamburguesas encontradas' });
    }

    const currentEstado = relevantHamburguesas[0].estado || 'pendiente';

    if (estado === 'pendiente' && currentEstado === 'porcionado') {
      return res.status(400).json({ error: 'No se puede desmarcar un porcionado' });
    }

    if (estado === 'porcionado' && currentEstado !== 'porcionado') {
      // Check if already porcionadas
      const alreadyPorcionadas = relevantHamburguesas.filter(h => h.estado === 'porcionado');
      
      if (alreadyPorcionadas.length === relevantHamburguesas.length) {
        // All already porcionadas, just return success
        res.json({ 
          success: true, 
          message: 'Todos los items ya están porcionados',
          producto,
          gramaje,
          estado: 'porcionado'
        });
        return;
      }

      // Calculate grams needed
      const toAddGrams = relevantHamburguesas
        .filter(h => h.estado !== 'porcionado')
        .reduce((sum, h) => sum + (Number(h.gramaje || 0) * Number(h.cantidad || 0)), 0);

      // Get all porcionados from the date to know what's already used
      const allDeliveries = await prisma.delivery.findMany({
        where: {
          fecha: {
            gte: range.start,
            lte: range.end,
          },
        },
        include: { hamburguesas: true },
      });

      const alreadyUsedGrams = allDeliveries
        .flatMap(d => d.hamburguesas)
        .filter(h => h.estado === 'porcionado')
        .reduce((sum, h) => sum + (Number(h.gramaje || 0) * Number(h.cantidad || 0)), 0);

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

      console.log('Porcionado calc:', {
        producto,
        gramaje,
        toAddGrams,
        alreadyUsedGrams,
        requiredGrams,
        availableGrams,
        barrasCount: barras.length,
      });

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

    // Update all matching hamburguesas
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.hamburguesa.updateMany({
        where: {
          delivery: {
            fecha: {
              gte: range.start,
              lte: range.end,
            },
          },
          tipo: producto,
          gramaje: gramaje,
          estado: { not: estado }, // Only update if not already in target state
        },
        data: {
          estado,
          updatedAt: new Date(),
        },
      });

      return updated;
    });

    res.json({
      success: true,
      producto,
      gramaje,
      estado,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error('Error updating porcionado:', error);
    res.status(500).json({ error: 'Failed to update porcionado' });
  }
});

// POST mark: mark hamburguesas as porcionado (consume barras)
porcionadosRouter.post('/mark', async (req, res) => {
  try {
    const { producto, gramaje, cantidad, fecha } = req.body || {};

    if (!producto || gramaje === undefined || cantidad === undefined || !fecha) {
      return res.status(400).json({ error: 'producto, gramaje, cantidad y fecha son requeridos' });
    }

    const range = buildDayRange(fecha);
    if (!range) return res.status(400).json({ error: 'Fecha inválida' });

    const result = await prisma.$transaction(async (tx) => {
      // Find all hamburguesas matching producto and gramaje for the date
      const deliveries = await tx.delivery.findMany({
        where: {
          fecha: {
            gte: range.start,
            lte: range.end,
          },
        },
        include: { hamburguesas: true },
      });

      const relevantHamburguesas = deliveries.flatMap(d => 
        d.hamburguesas.filter(h => 
          (h.tipo || 'hamburguesa') === producto && 
          Number(h.gramaje || 0) === gramaje
        )
      );

      if (relevantHamburguesas.length === 0) {
        throw new Error('No hamburguesas encontradas para porcionar');
      }

      // Check if all are already porcionadas
      const allPorcionadas = relevantHamburguesas.every(h => h.estado === 'porcionado');
      if (allPorcionadas) {
        return { success: true, message: 'Todos ya están porcionados' };
      }

      // Calculate what needs to be porcionado
      const toPorcionarHamburguesas = relevantHamburguesas.filter(h => h.estado !== 'porcionado');
      const toAddGrams = toPorcionarHamburguesas.reduce((sum, h) => 
        sum + (Number(h.gramaje || 0) * Number(h.cantidad || 0)), 0
      );

      // Get all porcionadas from the date to know what's already used
      const allPorcionadosHamburguesas = deliveries
        .flatMap(d => d.hamburguesas)
        .filter(h => h.estado === 'porcionado');
      
      const alreadyUsedGrams = allPorcionadosHamburguesas.reduce((sum, h) => 
        sum + (Number(h.gramaje || 0) * Number(h.cantidad || 0)), 0
      );

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

      // Update all matching hamburguesas to porcionado
      await tx.hamburguesa.updateMany({
        where: {
          delivery: {
            fecha: {
              gte: range.start,
              lte: range.end,
            },
          },
          tipo: producto,
          gramaje: gramaje,
          estado: { not: 'porcionado' },
        },
        data: {
          estado: 'porcionado',
          updatedAt: new Date(),
        },
      });

      return { success: true, producto, gramaje };
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error in mark porcionado:', error);
    if (error?.status === 409) {
      return res.status(409).json({ error: error.message, ...(error.payload || {}) });
    }
    res.status(500).json({ error: error.message || 'Failed to mark porcionado' });  }
});