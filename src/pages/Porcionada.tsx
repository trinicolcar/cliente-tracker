import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, ArrowUpDown } from 'lucide-react';
import { porcionadosService } from '@/services/porcionados';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { deliveriesService } from '@/services/deliveries';
import { clientsService } from '@/services/clients';
import Papa from 'papaparse';

const PorcionadaPage = () => {
    // CSV export handler
    const handleExportCSV = async () => {
      try {
        // Get deliveries for selected date
        const startDate = selectedDate;
        const endDate = selectedDate;
        const deliveries = await deliveriesService.getAll({ startDate, endDate });
        const clients = await clientsService.getAll();

        // Map clientId to client
        const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));

        // Build CSV rows
        const rows = deliveries.map((delivery, idx) => {
          const client = clientMap[delivery.clientId] || {};
          // Aggregate hamburguesas
          const hamburguesas = delivery.hamburguesas || [];
          const totalGrDiet = hamburguesas.reduce((sum, h) => sum + (h.gramaje || 0) * (h.cantidad || 0), 0);
          const totalGrPatas = hamburguesas.reduce((sum, h) => sum + (h.tipo === 'patas' ? (h.gramaje || 0) * (h.cantidad || 0) : 0), 0);
          const cantidad = hamburguesas.reduce((sum, h) => sum + (h.cantidad || 0), 0);
          const gramaje = hamburguesas.length > 0 ? hamburguesas[0].gramaje : 0;
          const gramajeTotal = hamburguesas.map(h => `${h.cantidad}x${h.gramaje} Gr`).join(' + ');
          const totalVenta = delivery.precioTotal || 0;
          return {
            numero_orden: delivery.id,
            fecha: new Date(delivery.fecha).toLocaleDateString('es-CO'),
            paquetes: 1,
            nombre_cliente: client.nombre || '',
            cantidad,
            gramos: gramaje,
            gramaje_total: gramajeTotal,
            direccion: client.direccion || '',
            telefono: client.telefono || '',
            total_gr_dieta: totalGrDiet,
            total_gr_patas: totalGrPatas,
            total_venta: totalVenta,
            producto: hamburguesas.length > 0 ? hamburguesas[0].tipo || 'Chef-bio Can' : 'Chef-bio Can',
            presentacion: `Chef-bio Can X ${(totalGrDiet / 1000).toLocaleString('es-CO')} kg`,
          };
        });

        // Convert to CSV
        const csv = Papa.unparse(rows);
        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `porcionada_${selectedDate}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('CSV descargado');
      } catch (err) {
        toast.error('Error al exportar CSV');
      }
    };
  const queryClient = useQueryClient();
  const getLocalDateString = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const [selectedDate, setSelectedDate] = useState<string>(
    getLocalDateString()
  );
  const [sortAsc, setSortAsc] = useState(true);

  const { data: porcionados = [], isLoading } = useQuery({
    queryKey: ['porcionados', selectedDate],
    queryFn: () => porcionadosService.getByDate(selectedDate),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const updateEstadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: 'pendiente' | 'porcionado' }) =>
      porcionadosService.updateEstado(id, estado, selectedDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['porcionados', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['barras'] });
    },
    onError: (error: any) => {
      const message = error?.message || 'No se pudo actualizar el estado';
      toast.error(message);
    },
  });

  const markMutation = useMutation({
    mutationFn: (data: { producto: string; gramaje: number; cantidad: number; fecha: string }) =>
      porcionadosService.markAndCreateIfMissing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['porcionados', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['barras'] });
    },
    onError: (error: any) => {
      const message = error?.message || 'No se pudo marcar porcionado';
      toast.error(message);
    },
  });

  const sorted = useMemo(() => {
    const items = [...porcionados];
    items.sort((a, b) => (sortAsc ? a.gramaje - b.gramaje : b.gramaje - a.gramaje));
    return items;
  }, [porcionados, sortAsc]);

  const handleMarkPorcionado = (item: any) => {
    if (item.porcionadoId) {
      updateEstadoMutation.mutate({ id: item.porcionadoId, estado: 'porcionado' });
    } else {
      markMutation.mutate({
        producto: item.producto,
        gramaje: item.gramaje,
        cantidad: item.cantidad,
        fecha: selectedDate,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4">
          <div>
            <h1 className="text-2xl font-semibold">Porcionada</h1>
            <p className="text-sm text-muted-foreground">
              Producción del día para porcionar por gramaje
            </p>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 items-end justify-between">
          <div>
            <label className="block text-sm text-muted-foreground">Fecha</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-1 block w-44 rounded-md border p-2"
            />
          </div>

          <Button variant="outline" onClick={() => setSortAsc((v) => !v)}>
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Ordenar por gramaje {sortAsc ? '↑' : '↓'}
          </Button>
          <Button variant="default" onClick={handleExportCSV}>
            Descargar CSV
          </Button>
        </div>

        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Gramaje</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No hay producción para la fecha seleccionada
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((item) => (
                  <TableRow key={item.id}>
                      <TableCell className="capitalize">{item.producto}</TableCell>
                      <TableCell>{item.gramaje} g</TableCell>
                      <TableCell>{item.cantidad}</TableCell>
                      <TableCell>
                        <Badge variant={item.estado === 'porcionado' ? 'default' : 'outline'}>
                          {item.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={item.estado === 'porcionado' ? 'outline' : 'default'}
                          disabled={item.estado === 'porcionado' || updateEstadoMutation.isLoading || markMutation.isLoading}
                          onClick={() => handleMarkPorcionado(item)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          {item.estado === 'porcionado' ? 'Porcionado' : 'Marcar porcionado'}
                        </Button>
                      </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default PorcionadaPage;
