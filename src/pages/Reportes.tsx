import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { deliveriesService } from '@/services/deliveries';
import { pagosService } from '@/services/pagos';
import { clientsService } from '@/services/clients';
import { Button } from '@/components/ui/button';

const toDate = (value?: string | Date) => (value ? new Date(value) : null);

const formatCurrency = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export default function ReportesPage() {
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');

  const { data: deliveries = [] } = useQuery({
    queryKey: ['deliveries'],
    queryFn: () => deliveriesService.getAll(),
  });

  const { data: pagos = [] } = useQuery({
    queryKey: ['pagos'],
    queryFn: () => pagosService.getAll(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsService.getAll(),
  });

  const clientsMap = useMemo(() => {
    const m = new Map<string, string>();
    (clients || []).forEach((c: any) => m.set(c.id, c.nombre));
    return m;
  }, [clients]);
  // NOTE: client balances and debt/credit lists are computed per selected date range

  const filtered = useMemo(() => {
    const startDate = start ? new Date(start) : null;
    const endDate = end ? new Date(end) : null;

    const inRange = (dateVal?: string | Date) => {
      const d = toDate(dateVal);
      if (!d) return false;
      if (startDate && d < startDate) return false;
      if (endDate) {
        // include whole day for end date
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (d > endOfDay) return false;
      }
      return true;
    };

    const deliveriesInRange = deliveries.filter((d: any) => inRange(d.fecha));
    const pagosInRange = pagos.filter((p: any) => inRange(p.fechaPago));

    const totalDeliveries = deliveriesInRange.reduce((s: number, d: any) => s + (d.precioTotal || 0), 0);
    const totalPagos = pagosInRange.reduce((s: number, p: any) => s + (p.monto || 0), 0);

    // compute per-client balance using deliveries/pagos in range
    const balances = new Map<string, number>();
    (clients || []).forEach((c: any) => {
      const id = c.id;
      const sumDeliveries = deliveriesInRange
        .filter((d: any) => d.clientId === id)
        .reduce((s: number, d: any) => s + (Number(d.precioTotal) || 0), 0);
      const sumPagos = pagosInRange
        .filter((p: any) => p.clientId === id)
        .reduce((s: number, p: any) => s + (Number(p.monto) || 0), 0);
      balances.set(id, sumDeliveries - sumPagos);
    });

    const totalDeudas = (clients || []).reduce((s: number, c: any) => {
      const bal = balances.get(c.id) ?? 0;
      return s + (bal > 0 ? bal : 0);
    }, 0);

    const totalSaldosFavor = (clients || []).reduce((s: number, c: any) => {
      const bal = balances.get(c.id) ?? 0;
      return s + (bal < 0 ? Math.abs(bal) : 0);
    }, 0);

    const clientsWithDebt = (clients || []).filter((c: any) => (balances.get(c.id) ?? 0) > 0)
      .map((c: any) => ({ id: c.id, nombre: c.nombre, balance: balances.get(c.id) ?? 0 }));

    const clientsWithCredit = (clients || []).filter((c: any) => (balances.get(c.id) ?? 0) < 0)
      .map((c: any) => ({ id: c.id, nombre: c.nombre, balance: balances.get(c.id) ?? 0 }));

    return {
      deliveriesInRange,
      pagosInRange,
      totalDeliveries,
      totalPagos,
      totalDeudas,
      totalSaldosFavor,
      clientsWithDebt,
      clientsWithCredit,
    };
  }, [start, end, deliveries, pagos, clients]);

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-semibold mb-4">Reporte general</h1>

      <div className="flex gap-3 items-end mb-6">
        <div>
          <label className="block text-sm text-muted-foreground">Desde</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1 block w-44 rounded-md border p-2"
          />
        </div>

        <div>
          <label className="block text-sm text-muted-foreground">Hasta</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="mt-1 block w-44 rounded-md border p-2"
          />
        </div>

        <div>
          <Button onClick={() => { setStart(''); setEnd(''); }}>Limpiar</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="p-4 border rounded">
          <div className="text-sm text-muted-foreground">Total entregas</div>
          <div className="text-xl font-bold">{filtered.deliveriesInRange.length}</div>
          <div className="text-sm">{formatCurrency(filtered.totalDeliveries)}</div>
        </div>

        <div className="p-4 border rounded">
          <div className="text-sm text-muted-foreground">Total pagos</div>
          <div className="text-xl font-bold">{filtered.pagosInRange.length}</div>
          <div className="text-sm">{formatCurrency(filtered.totalPagos)}</div>
        </div>

        <div className="p-4 border rounded">
          <div className="text-sm text-muted-foreground">Balance (entregas - pagos)</div>
          <div className="text-xl font-bold">{formatCurrency(filtered.totalDeliveries - filtered.totalPagos)}</div>
        </div>

        <div className="p-4 border rounded">
          <div className="text-sm text-muted-foreground">Total deudas (clientes)</div>
          <div className="text-xl font-bold">{formatCurrency(filtered.totalDeudas)}</div>
        </div>

        <div className="p-4 border rounded">
          <div className="text-sm text-muted-foreground">Total saldos a favor (clientes)</div>
          <div className="text-xl font-bold">{formatCurrency(filtered.totalSaldosFavor)}</div>
        </div>
      </div>

      <div className="grid gap-6">
        <div>
          <h2 className="font-medium mb-2">Entregas</h2>
          <div className="overflow-auto border rounded">
            <table className="w-full">
              <thead className="bg-muted text-left text-sm">
                <tr>
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Cliente</th>
                  <th className="p-2">Precio</th>
                </tr>
              </thead>
              <tbody>
                {filtered.deliveriesInRange.map((d: any) => (
                  <tr key={d.id} className="border-t">
                    <td className="p-2">{new Date(d.fecha).toLocaleString()}</td>
                    <td className="p-2">{clientsMap.get(d.clientId) || d.client?.nombre || d.clientId}</td>
                    <td className="p-2">{formatCurrency(d.precioTotal || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="font-medium mb-2">Pagos</h2>
          <div className="overflow-auto border rounded">
            <table className="w-full">
              <thead className="bg-muted text-left text-sm">
                <tr>
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Cliente</th>
                  <th className="p-2">Monto</th>
                </tr>
              </thead>
              <tbody>
                {filtered.pagosInRange.map((p: any) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{new Date(p.fechaPago).toLocaleString()}</td>
                    <td className="p-2">{clientsMap.get(p.clientId) || p.client?.nombre || p.clientId}</td>
                    <td className="p-2">{formatCurrency(p.monto || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="font-medium mb-2">Clientes con saldo (≠ 0)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-3">
              <div className="text-sm text-muted-foreground mb-2">Deudas ({filtered.clientsWithDebt.length})</div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left">
                    <tr>
                      <th className="p-2">Cliente</th>
                      <th className="p-2">Debe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.clientsWithDebt.map((c: any) => (
                      <tr key={c.id} className="border-t">
                        <td className="p-2">{c.nombre}</td>
                        <td className="p-2">{formatCurrency(c.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border rounded p-3">
              <div className="text-sm text-muted-foreground mb-2">Saldos a favor ({filtered.clientsWithCredit.length})</div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left">
                    <tr>
                      <th className="p-2">Cliente</th>
                      <th className="p-2">Saldo a favor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.clientsWithCredit.map((c: any) => (
                      <tr key={c.id} className="border-t">
                        <td className="p-2">{c.nombre}</td>
                        <td className="p-2">{formatCurrency(Math.abs(c.balance))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
