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

const PorcionadaPage = () => {
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

  const sorted = useMemo(() => {
    const items = [...porcionados];
    items.sort((a, b) => (sortAsc ? a.gramaje - b.gramaje : b.gramaje - a.gramaje));
    return items;
  }, [porcionados, sortAsc]);

  const handleMarkPorcionado = (id: string) => {
    updateEstadoMutation.mutate({ id, estado: 'porcionado' });
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
                        disabled={item.estado === 'porcionado'}
                        onClick={() => handleMarkPorcionado(item.id)}
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
