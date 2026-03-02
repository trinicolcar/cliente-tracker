import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { barrasService } from '@/services/barras';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

const BarrasPage = () => {
  const queryClient = useQueryClient();
  const [pesoGramos, setPesoGramos] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fechaProduccion, setFechaProduccion] = useState(
    new Date().toISOString().split('T')[0]
  );

  const { data: barras = [], isLoading } = useQuery({
    queryKey: ['barras'],
    queryFn: () => barrasService.getAll(),
  });

  const createBarraMutation = useMutation({
    mutationFn: barrasService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barras'] });
      toast.success('Barra registrada');
      setPesoGramos('');
      setCantidad('');
    },
    onError: (error: any) => {
      const message = error?.message || 'No se pudo registrar la barra';
      toast.error(message);
    },
  });

  const deleteBarraMutation = useMutation({
    mutationFn: barrasService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barras'] });
      toast.success('Barra eliminada');
    },
    onError: (error: any) => {
      const message = error?.message || 'No se pudo eliminar la barra';
      toast.error(message);
    },
  });

  const handleCreate = () => {
    if (!pesoGramos.trim() || !cantidad.trim() || !fechaProduccion) {
      toast.error('Completa todos los campos');
      return;
    }

    const peso = Number(pesoGramos);
    const cant = Number(cantidad);

    if (peso <= 0 || cant <= 0) {
      toast.error('Peso y cantidad deben ser mayores a 0');
      return;
    }

    createBarraMutation.mutate({
      pesoGramos: peso,
      cantidad: cant,
      fechaProduccion: new Date(fechaProduccion),
      disponible: true,
    });
  };

  const totalBarras = barras.reduce((sum, b) => sum + Number(b.cantidad || 0), 0);
  const totalGramos = barras.reduce(
    (sum, b) => sum + Number(b.pesoGramos || 0) * Number(b.cantidad || 0),
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4">
          <div>
            <h1 className="text-2xl font-semibold">Inventario de Barras</h1>
            <p className="text-sm text-muted-foreground">
              Registra la producción de barras y controla el stock
            </p>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Barras disponibles</p>
            <p className="text-2xl font-semibold">{totalBarras}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Gramos disponibles</p>
            <p className="text-2xl font-semibold">{totalGramos.toLocaleString()}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registrar producción</CardTitle>
            <CardDescription>Ingresa la cantidad de barras y su peso</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Fecha</label>
              <Input
                type="date"
                value={fechaProduccion}
                onChange={(e) => setFechaProduccion(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Peso (g)</label>
              <Input
                type="number"
                placeholder="Ej: 1000"
                value={pesoGramos}
                onChange={(e) => setPesoGramos(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Cantidad</label>
              <Input
                type="number"
                placeholder="Ej: 12"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreate} disabled={createBarraMutation.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Peso (g)</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : barras.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No hay barras registradas
                  </TableCell>
                </TableRow>
              ) : (
                barras.map((barra) => (
                  <TableRow key={barra.id}>
                    <TableCell>
                      {new Date(barra.fechaProduccion).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{barra.pesoGramos}</TableCell>
                    <TableCell>{barra.cantidad}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteBarraMutation.mutate(barra.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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

export default BarrasPage;
