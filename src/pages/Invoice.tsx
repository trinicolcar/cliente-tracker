import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';

// Función auxiliar para parsear fechas en hora local (evita problemas de zona horaria)
const parseDateLocal = (dateString: string | Date): Date => {
  if (dateString instanceof Date) return dateString;
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
};

const fetchInvoice = async (deliveryId: string) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/deliveries/${deliveryId}/invoice`);
  if (!res.ok) throw new Error('Failed to fetch invoice');
  return res.json();
};

export default function InvoicePage() {
  const { id } = useParams();

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => fetchInvoice(id as string),
    enabled: !!id,
  });

  if (isLoading) return <div className="container py-6">Cargando factura...</div>;
  if (error) return <div className="container py-6">Error al cargar la factura</div>;

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Factura - {invoice.deliveryId}</h1>
        <div className="flex gap-2">
          <Button onClick={() => window.print()}>Imprimir</Button>
        </div>
      </div>

      <div className="border p-6 rounded bg-white">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h2 className="font-medium">Cliente</h2>
            <div>{invoice.client.nombre}</div>
            <div className="text-sm text-muted-foreground">{invoice.client.direccion}</div>
            <div className="text-sm text-muted-foreground">{invoice.client.telefono}</div>
          </div>
          <div className="text-right">
            <div>Fecha: {parseDateLocal(invoice.fecha).toLocaleString()}</div>
            <div>Entrega ID: {invoice.deliveryId}</div>
          </div>
        </div>

        <table className="w-full mb-4">
          <thead>
            <tr className="text-left">
              <th>Descripción</th>
              <th>Cantidad</th>
              <th>Gramaje</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it: any, idx: number) => (
              <tr key={idx} className="border-t">
                <td className="p-2">{it.descripcion || 'Item'}</td>
                <td className="p-2">{it.cantidad}</td>
                <td className="p-2">{it.gramaje ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end gap-6">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Subtotal</div>
            <div className="text-xl font-bold">{invoice.subtotal.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Pagos</div>
            <div className="text-xl font-bold">{invoice.pagos.reduce((s: number, p: any) => s + p.monto, 0).toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Saldo</div>
            <div className="text-2xl font-bold">{invoice.balanceDue.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
