import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check } from 'lucide-react';
import { clientsService } from '@/services/clients';
import { deliveriesService } from '@/services/deliveries';
import { pagosService } from '@/services/pagos';
import { ClientCombobox } from '@/components/ClientCombobox';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const PagosPage = () => {
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>('');
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState<'efectivo' | 'transferencia' | 'otro'>('efectivo');
  const [descripcion, setDescripcion] = useState('');

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsService.getAll,
  });

  // Fetch deliveries
  const { data: deliveries = [] } = useQuery({
    queryKey: ['deliveries'],
    queryFn: deliveriesService.getAll,
  });

  // Fetch pagos
  const { data: pagos = [] } = useQuery({
    queryKey: ['pagos'],
    queryFn: pagosService.getAll,
  });

  // Create pago mutation
  const createPagoMutation = useMutation({
    mutationFn: pagosService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Pago registrado exitosamente');
      // Limpiar formulario
      setSelectedDeliveryId('');
      setMonto('');
      setMetodo('efectivo');
      setDescripcion('');
    },
    onError: () => {
      toast.error('Error al registrar el pago');
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Obtener entregas del cliente seleccionado
  const clientDeliveries = selectedClient
    ? deliveries.filter((d) => d.clientId === selectedClient)
    : [];

  // Calcular total de entregas del cliente
  const totalEntregas = clientDeliveries.reduce(
    (acc, d) => acc + d.precioTotal,
    0
  );

  // Calcular total pagado por el cliente
  const totalPagado = pagos
    .filter((p) => p.clientId === selectedClient)
    .reduce((acc, p) => acc + p.monto, 0);

  const handleRegistrarPago = () => {
    if (!selectedClient) {
      toast.error('Por favor selecciona un cliente');
      return;
    }

    if (!selectedDeliveryId) {
      toast.error('Por favor selecciona una entrega');
      return;
    }

    if (!monto.trim()) {
      toast.error('Por favor ingresa el monto del pago');
      return;
    }

    const montoValue = parseFloat(monto);
    if (montoValue <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    createPagoMutation.mutate({
      clientId: selectedClient,
      deliveryId: selectedDeliveryId,
      monto: montoValue,
      fechaPago: new Date(),
      metodo,
      descripcion: descripcion.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4">
          <div>
            <h1 className="text-2xl font-semibold">Registro de Pagos</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los cobros a los clientes y mantén la trazabilidad
            </p>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Formulario de pagos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Selección de cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Seleccionar Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <ClientCombobox
                  clients={clients}
                  value={selectedClient}
                  onValueChange={setSelectedClient}
                  placeholder="Buscar cliente..."
                />
              </CardContent>
            </Card>

            {/* Entregas disponibles */}
            {selectedClient && clientDeliveries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Entregas del Cliente
                  </CardTitle>
                  <CardDescription>
                    Selecciona la entrega asociada a este pago
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedDeliveryId} onValueChange={setSelectedDeliveryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar entrega..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clientDeliveries.map((delivery) => (
                        <SelectItem key={delivery.id} value={delivery.id}>
                          {format(new Date(delivery.fecha), 'PPP', { locale: es })} - {formatCurrency(delivery.precioTotal)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Datos del pago */}
            {selectedClient && selectedDeliveryId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detalles del Pago</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Monto a Pagar
                    </label>
                    <Input
                      type="number"
                      placeholder="Ej: 50000"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Método de Pago
                    </label>
                    <Select
                      value={metodo}
                      onValueChange={(value: any) => setMetodo(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="transferencia">
                          Transferencia
                        </SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Descripción (Opcional)
                    </label>
                    <Input
                      placeholder="Notas del pago"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                    />
                  </div>

                  {monto && (
                    <Button
                      onClick={handleRegistrarPago}
                      size="lg"
                      className="w-full"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Registrar Pago
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {selectedClient && clientDeliveries.length === 0 && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-center text-muted-foreground">
                    Este cliente no tiene entregas registradas
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Panel de información */}
          <div>
            {selectedClient && (
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-base">
                    {clients.find((c) => c.id === selectedClient)?.nombre}
                  </CardTitle>
                  <CardDescription>
                    {clients.find((c) => c.id === selectedClient)?.telefono}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Total de Entregas */}
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      Total de Entregas
                    </p>
                    <p className="text-xl font-bold">
                      {formatCurrency(totalEntregas)}
                    </p>
                  </div>

                  {/* Total de Pagos */}
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      Total de Pagos
                    </p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(totalPagado)}
                    </p>
                  </div>

                  {/* Saldo Pendiente */}
                  <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/50">
                    <p className="text-xs text-muted-foreground mb-1">
                      Saldo Pendiente
                    </p>
                    <p className="text-2xl font-bold text-destructive">
                      {formatCurrency(totalEntregas - totalPagado)}
                    </p>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-1">
                      Total de Entregas
                    </p>
                    <p className="text-lg font-bold">
                      {clientDeliveries.length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Histórico de pagos */}
        {pagos.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Histórico de Pagos</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Entregas</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Descripción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagos.map((pago) => (
                        <TableRow key={pago.id}>
                          <TableCell className="text-sm font-medium">
                            {format(new Date(pago.fechaPago), 'PPp', {
                              locale: es,
                            })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {clients.find((c) => c.id === pago.clientId)?.nombre}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {deliveries.find((d) => d.id === pago.deliveryId)?.fecha 
                                ? format(new Date(deliveries.find((d) => d.id === pago.deliveryId)!.fecha), 'PP', { locale: es })
                                : 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                pago.metodo === 'efectivo'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {pago.metodo === 'efectivo'
                                ? '💵 Efectivo'
                                : pago.metodo === 'transferencia'
                                  ? '🏦 Transferencia'
                                  : '❓ Otro'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold">
                            {formatCurrency(pago.monto)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {pago.descripcion || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Resumen de pagos */}
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm text-muted-foreground">Total Pagos</p>
                    <p className="font-bold">
                      {formatCurrency(
                        pagos.reduce((acc, p) => acc + p.monto, 0)
                      )}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-muted-foreground">
                      Pagos Registrados
                    </p>
                    <p className="font-bold">{pagos.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default PagosPage;
