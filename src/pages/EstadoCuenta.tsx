import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { clientsService } from '@/services/clients';
import { deliveriesService } from '@/services/deliveries';
import { pagosService } from '@/services/pagos';
import { ClientCombobox } from '@/components/ClientCombobox';
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

const EstadoCuentaPage = () => {
  const [selectedClient, setSelectedClient] = useState<string>('');

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const clientDeliveries = selectedClient
    ? deliveries.filter((d) => d.clientId === selectedClient)
    : [];

  const clientPagos = selectedClient
    ? pagos.filter((p) => p.clientId === selectedClient)
    : [];

  const totalEntregas = clientDeliveries.reduce((acc, d) => acc + d.precioTotal, 0);
  const totalPagos = clientPagos.reduce((acc, p) => acc + p.monto, 0);
  const saldoPendiente = totalEntregas - totalPagos;

  const selectedClientData = clients.find((c) => c.id === selectedClient);

  // Combinar entregas y pagos en una sola línea de tiempo
  const timeline = [
    ...clientDeliveries.map((d) => ({
      id: d.id,
      tipo: 'entrega' as const,
      fecha: d.fecha,
      monto: d.precioTotal,
      detalles: `${d.hamburguesas.length} tipos de hamburguesas`,
      hamburguesas: d.hamburguesas,
    })),
    ...clientPagos.map((p) => ({
      id: p.id,
      tipo: 'pago' as const,
      fecha: p.fechaPago,
      monto: p.monto,
      detalles: `${p.metodo === 'efectivo' ? '💵 Efectivo' : p.metodo === 'transferencia' ? '🏦 Transferencia' : '❓ Otro'}${p.descripcion ? ` - ${p.descripcion}` : ''}`,
      metodo: p.metodo,
    })),
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4">
          <div>
            <h1 className="text-2xl font-semibold">Estado de Cuenta</h1>
            <p className="text-sm text-muted-foreground">
              Consulta el detalle de entregas y pagos por cliente
            </p>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Selección de cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seleccionar Cliente</CardTitle>
            <CardDescription>
              Elige un cliente para ver su historial de entregas y pagos
            </CardDescription>
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

        {/* Resumen de cuenta */}
        {selectedClient && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Entregas */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Total Entregas
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(totalEntregas)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {clientDeliveries.length} entregas registradas
                  </p>
                </CardContent>
              </Card>

              {/* Total Pagos */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Total Pagos
                    </CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalPagos)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {clientPagos.length} pagos realizados
                  </p>
                </CardContent>
              </Card>

              {/* Saldo Pendiente */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Saldo Pendiente
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      saldoPendiente > 0
                        ? 'text-destructive'
                        : saldoPendiente < 0
                          ? 'text-green-600'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {formatCurrency(saldoPendiente)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {saldoPendiente > 0
                      ? 'Por pagar'
                      : saldoPendiente < 0
                        ? 'Crédito a favor'
                        : 'Al día'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Información del cliente */}
            {selectedClientData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Información del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre</p>
                      <p className="font-medium">{selectedClientData.nombre}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{selectedClientData.telefono}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dirección</p>
                      <p className="font-medium">{selectedClientData.direccion}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado</p>
                      <Badge variant={selectedClientData.activo ? 'default' : 'secondary'}>
                        {selectedClientData.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline de entregas y pagos */}
            <Card>
              <CardHeader>
                <CardTitle>Historial de Movimientos</CardTitle>
                <CardDescription>
                  Todas las entregas y pagos registrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay movimientos registrados para este cliente
                  </p>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[120px]">Fecha</TableHead>
                          <TableHead className="w-[100px]">Tipo</TableHead>
                          <TableHead>Detalles</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {timeline.map((item) => (
                          <TableRow key={`${item.tipo}-${item.id}`}>
                            <TableCell className="text-sm">
                              {format(new Date(item.fecha), 'dd MMM yyyy', {
                                locale: es,
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.tipo === 'entrega' ? 'default' : 'secondary'
                                }
                              >
                                {item.tipo === 'entrega' ? '📦 Entrega' : '💰 Pago'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.detalles}
                              {'hamburguesas' in item && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {item.hamburguesas.map((h, idx) => (
                                    <span key={h.id}>
                                      {h.cantidad} × {h.gramaje}g
                                      {h.descripcion && ` (${h.descripcion})`}
                                      {idx < item.hamburguesas.length - 1 && ', '}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                            <TableCell
                              className={`text-right font-semibold ${
                                item.tipo === 'entrega'
                                  ? 'text-destructive'
                                  : 'text-green-600'
                              }`}
                            >
                              {item.tipo === 'entrega' ? '+' : '-'}
                              {formatCurrency(item.monto)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default EstadoCuentaPage;
