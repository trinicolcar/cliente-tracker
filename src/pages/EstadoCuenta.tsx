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

// Función auxiliar para parsear fechas en hora local (evita problemas de zona horaria)
const parseDateLocal = (dateString: string | Date): Date => {
  if (dateString instanceof Date) return dateString;
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
};

const EstadoCuentaPage = () => {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');

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

  // Función para filtrar por rango de fechas
  const inDateRange = (dateVal: string | Date) => {
    if (!dateStart && !dateEnd) return true;
    const d = parseDateLocal(dateVal);
    
    if (dateStart) {
      const startDate = new Date(dateStart);
      if (d < startDate) return false;
    }
    
    if (dateEnd) {
      const endDate = new Date(dateEnd);
      endDate.setHours(23, 59, 59, 999);
      if (d > endDate) return false;
    }
    
    return true;
  };

  // Filtrar entregas y pagos por rango de fechas
  const deliveriesFiltered = clientDeliveries.filter((d) => inDateRange(d.fecha));
  const pagosFiltered = clientPagos.filter((p) => inDateRange(p.fechaPago));

  const selectedClientData = clients.find((c) => c.id === selectedClient);
  
  const totalEntregas = deliveriesFiltered.reduce((acc, d) => acc + d.precioTotal, 0);
  const totalPagos = pagosFiltered.reduce((acc, p) => acc + p.monto, 0);
  
  // Saldo inicial desde el Excel
  const saldoInicial = selectedClientData?.estadoCuenta || 0;
  
  // Saldo por movimientos registrados en el sistema
  const movimientosRegistrados = totalEntregas - totalPagos;
  
  // Saldo total = saldo inicial + movimientos
  const saldoTotal = saldoInicial + movimientosRegistrados;

  // Combinar entregas y pagos en una sola línea de tiempo (filtrados por fecha)
  const timeline = [
    ...deliveriesFiltered.map((d) => ({
      id: d.id,
      tipo: 'entrega' as const,
      fecha: d.fecha,
      monto: d.precioTotal,
      detalles: `${d.hamburguesas.length} tipos de hamburguesas`,
      hamburguesas: d.hamburguesas,
    })),
    ...pagosFiltered.map((p) => ({
      id: p.id,
      tipo: 'pago' as const,
      fecha: p.fechaPago,
      monto: p.monto,
      detalles: `${p.metodo === 'efectivo' ? '💵 Efectivo' : p.metodo === 'transferencia' ? '🏦 Transferencia' : '❓ Otro'}${p.descripcion ? ` - ${p.descripcion}` : ''}`,
      metodo: p.metodo,
    })),
  ].sort((a, b) => parseDateLocal(b.fecha).getTime() - parseDateLocal(a.fecha).getTime());

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

        {/* Filtros de fecha */}
        {selectedClient && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filtrar por Fecha</CardTitle>
              <CardDescription>
                Selecciona un rango de fechas para filtrar entregas y pagos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm text-muted-foreground mb-2">Desde</label>
                  <input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="w-full rounded-md border p-2"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm text-muted-foreground mb-2">Hasta</label>
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="w-full rounded-md border p-2"
                  />
                </div>

                {(dateStart || dateEnd) && (
                  <button
                    onClick={() => {
                      setDateStart('');
                      setDateEnd('');
                    }}
                    className="px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumen de cuenta */}
        {selectedClient && (
          <>
            {(dateStart || dateEnd) && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                Mostrando datos desde {dateStart ? new Date(dateStart).toLocaleDateString('es-CO') : 'el inicio'} hasta {dateEnd ? new Date(dateEnd).toLocaleDateString('es-CO') : 'hoy'}
              </div>
            )}            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Saldo Inicial (del Excel) */}
              <Card className="border-2 border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Saldo Inicial
                    </CardTitle>
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      saldoInicial > 0
                        ? 'text-red-600'
                        : saldoInicial < 0
                          ? 'text-green-600'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {formatCurrency(saldoInicial)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {saldoInicial > 0
                      ? 'Deuda inicial (Excel)'
                      : saldoInicial < 0
                        ? 'Crédito inicial'
                        : 'Sin deuda inicial'}
                  </p>
                </CardContent>
              </Card>

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
                  <div className="text-2xl font-bold text-red-600">
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
                      Saldo Total Actual
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      saldoTotal > 0
                        ? 'text-destructive'
                        : saldoTotal < 0
                          ? 'text-green-600'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {formatCurrency(saldoTotal)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {saldoTotal > 0
                      ? 'Por pagar'
                      : saldoTotal < 0
                        ? 'Crédito a favor'
                        : 'Al día'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tarjeta explicativa del cálculo */}
            {saldoInicial !== 0 && (
              <Card className="border-blue-200 bg-blue-50/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-blue-100 p-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">Cálculo del Saldo</h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>💼 Saldo inicial (Excel): <span className="font-medium text-foreground">{formatCurrency(saldoInicial)}</span></p>
                        <p>➕ Entregas registradas: <span className="font-medium text-red-600">+{formatCurrency(totalEntregas)}</span></p>
                        <p>➖ Pagos registrados: <span className="font-medium text-green-600">-{formatCurrency(totalPagos)}</span></p>
                        <div className="border-t pt-1 mt-2">
                          <p className="font-semibold text-foreground">
                            = Saldo Total: <span className={saldoTotal > 0 ? 'text-red-600' : saldoTotal < 0 ? 'text-green-600' : ''}>{formatCurrency(saldoTotal)}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                              {format(parseDateLocal(item.fecha), 'dd MMM yyyy', {
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
