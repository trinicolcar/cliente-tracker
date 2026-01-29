import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Save, Calendar, CalendarClock } from 'lucide-react';
import { Hamburguesa } from '@/types/delivery';
import { clientsService } from '@/services/clients';
import { deliveriesService } from '@/services/deliveries';
import { ClientSelector } from '@/components/delivery/ClientSelector';
import { ProductForm } from '@/components/delivery/ProductForm';
import { RescheduleDeliveryDialog } from '@/components/delivery/RescheduleDeliveryDialog';
import { Button } from '@/components/ui/button';
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
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { toast } from 'sonner';

// Función auxiliar para parsear fechas en hora local (evita problemas de zona horaria)
const parseDateLocal = (dateString: string | Date): Date => {
  if (dateString instanceof Date) return dateString;
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
};

const DeliveryPage = () => {
  const queryClient = useQueryClient();
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [hamburguesas, setHamburguesas] = useState<Hamburguesa[]>([]);
  const [precioTotal, setPrecioTotal] = useState('');
  const [precioManualmenteEditado, setPrecioManualmenteEditado] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [rescheduleDialog, setRescheduleDialog] = useState<{
    open: boolean;
    delivery: any;
    clientName: string;
  }>({ open: false, delivery: null, clientName: '' });

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

  // Create delivery mutation
  const createDeliveryMutation = useMutation({
    mutationFn: deliveriesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      const client = clients.find(c => c.id === selectedClientId);
      toast.success(`Entrega registrada para ${client?.nombre}`);
      // Limpiar formulario
      setSelectedClientId('');
      setHamburguesas([]);
      setPrecioTotal('');
      setPrecioManualmenteEditado(false);
    },
    onError: () => {
      toast.error('Error al registrar la entrega');
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Calcular precio total automáticamente basado en los productos
  useEffect(() => {
    // Si el usuario ha editado manualmente, no hacer nada
    if (precioManualmenteEditado) {
      return;
    }

    // Calcular el total de los items con precio
    const totalItems = hamburguesas.reduce((acc, item) => {
      if (item.precio && item.cantidad) {
        return acc + (item.precio * item.cantidad);
      }
      return acc;
    }, 0);
    
    // Solo actualizar el precio si el campo está vacío
    // De lo contrario, mantener el valor actual para que el usuario pueda sumar manualmente
    if (!precioTotal && totalItems > 0) {
      setPrecioTotal(totalItems.toString());
    } else if (hamburguesas.length === 0) {
      setPrecioTotal('');
    }
  }, [hamburguesas, precioManualmenteEditado]);

  const handleAddHamburguesa = (hamburguesa: Hamburguesa) => {
    // Agregar tipo en la descripción si no tiene descripción
    const productoConDescripcion = {
      ...hamburguesa,
      descripcion: hamburguesa.descripcion || (hamburguesa.tipo === 'nuggets' ? 'Nuggets' : 'Hamburguesa')
    };
    setHamburguesas((prev) => [...prev, productoConDescripcion]);
    
    // Sumar automáticamente el precio si el usuario no ha editado manualmente y el producto tiene precio
    if (!precioManualmenteEditado && hamburguesa.precio && hamburguesa.cantidad) {
      const nuevoPrecio = hamburguesa.precio * hamburguesa.cantidad;
      const precioActual = precioTotal ? parseFloat(precioTotal) : 0;
      setPrecioTotal((precioActual + nuevoPrecio).toString());
    }
    
    toast.success(hamburguesa.tipo === 'nuggets' ? 'Nuggets agregados' : 'Hamburguesa agregada');
  };

  const handleRemoveHamburguesa = (hamburgesaId: string) => {
    const item = hamburguesas.find(h => h.id === hamburgesaId);
    setHamburguesas((prev) => prev.filter((h) => h.id !== hamburgesaId));
    
    // Restar automáticamente el precio si el usuario no ha editado manualmente y el producto tiene precio
    if (!precioManualmenteEditado && item?.precio && item?.cantidad) {
      const precioARestar = item.precio * item.cantidad;
      const precioActual = precioTotal ? parseFloat(precioTotal) : 0;
      const nuevoPrecio = Math.max(0, precioActual - precioARestar);
      setPrecioTotal(nuevoPrecio > 0 ? nuevoPrecio.toString() : '');
    }
    
    toast.success(item?.tipo === 'nuggets' ? 'Nuggets removidos' : 'Hamburguesa removida');
  };

  const handleUpdateHamburguesa = (updatedHamburguesa: Hamburguesa) => {
    // Encontrar el item anterior para calcular la diferencia
    const itemAnterior = hamburguesas.find(h => h.id === updatedHamburguesa.id);
    
    // Agregar tipo en la descripción si no tiene descripción
    const productoConDescripcion = {
      ...updatedHamburguesa,
      descripcion: updatedHamburguesa.descripcion || (updatedHamburguesa.tipo === 'nuggets' ? 'Nuggets' : 'Hamburguesa')
    };
    setHamburguesas((prev) =>
      prev.map((h) => (h.id === productoConDescripcion.id ? productoConDescripcion : h))
    );
    
    // Recalcular el precio si el usuario no ha editado manualmente
    if (!precioManualmenteEditado) {
      const precioActual = precioTotal ? parseFloat(precioTotal) : 0;
      let nuevoPrecio = precioActual;
      
      // Restar el precio anterior si existía
      if (itemAnterior?.precio && itemAnterior?.cantidad) {
        nuevoPrecio -= (itemAnterior.precio * itemAnterior.cantidad);
      }
      
      // Sumar el precio nuevo
      if (updatedHamburguesa.precio && updatedHamburguesa.cantidad) {
        nuevoPrecio += (updatedHamburguesa.precio * updatedHamburguesa.cantidad);
      }
      
      setPrecioTotal(nuevoPrecio > 0 ? nuevoPrecio.toString() : '');
    }
    
    toast.success(updatedHamburguesa.tipo === 'nuggets' ? 'Nuggets actualizados' : 'Hamburguesa actualizada');
  };

  const handleSaveDelivery = () => {
    if (!selectedClientId) {
      toast.error('Por favor selecciona un cliente');
      return;
    }

    if (hamburguesas.length === 0) {
      toast.error('Por favor agrega al menos una hamburguesa');
      return;
    }

    const totalCalculado = hamburguesas.reduce((acc, item) => {
      if (item.precio && item.cantidad) {
        return acc + (item.precio * item.cantidad);
      }
      return acc;
    }, 0);

    const precioFinal = precioTotal.trim() ? parseFloat(precioTotal) : totalCalculado;

    if (precioFinal <= 0) {
      toast.error('El precio total debe ser mayor a 0');
      return;
    }

    // Crear fecha en hora local para evitar desfase de zona horaria
    const [year, month, day] = selectedDate.split('-').map(Number);
    const fechaLocal = new Date(year, month - 1, day);
    
    createDeliveryMutation.mutate({
      clientId: selectedClientId,
      fecha: fechaLocal,
      hamburguesas: hamburguesas,
      precioTotal: precioFinal,
    });
  };

  // Agrupar entregas por día
  const deliveriesByDay = deliveries.reduce(
    (acc, delivery) => {
      const dayKey = format(parseDateLocal(delivery.fecha), 'yyyy-MM-dd');
      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }
      acc[dayKey].push(delivery);
      return acc;
    },
    {} as Record<string, any[]>
  );

  // Ordenar días (más antiguos primero)
  const sortedDays = Object.keys(deliveriesByDay).sort();

  // Paginación
  const totalPages = Math.ceil(sortedDays.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDays = sortedDays.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const selectedClient = clients.find(c => c.id === selectedClientId) || null;

  // Auto-calc precioTotal from client's valorKg when hamburguesas change
  useEffect(() => {
    if (!selectedClient) return;
    if (!selectedClient.valorKg) return;
    if (!hamburguesas || hamburguesas.length === 0) return;

    // If user already set a precioTotal manually, don't overwrite
    if (precioTotal && precioTotal.trim() !== '') return;

    const totalGramos = hamburguesas.reduce((acc, h) => acc + h.cantidad * h.gramaje, 0);
    const totalKg = totalGramos / 1000;
    const computed = Math.round(totalKg * (selectedClient.valorKg || 0));
    if (!isNaN(computed)) {
      setPrecioTotal(String(computed));
    }
  }, [hamburguesas, selectedClient]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4">
          <div>
            <h1 className="text-2xl font-semibold">Agenda de Entregas</h1>
            <p className="text-sm text-muted-foreground">
              Planifica entregas de hamburguesas por día
            </p>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Formulario de entregas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Selección de cliente */}
            <ClientSelector
              clients={clients}
              selectedClient={selectedClient}
              onClientSelect={(client) => setSelectedClientId(client?.id || '')}
            />

            {/* Selección de fecha */}
            {selectedClient && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </CardContent>
              </Card>
            )}

            {/* Formulario de hamburguesas */}
            {selectedClient && (
              <>
                <ProductForm
                  hamburguesas={hamburguesas}
                  onAddHamburguesa={handleAddHamburguesa}
                  onRemoveHamburguesa={handleRemoveHamburguesa}
                  onUpdateHamburguesa={handleUpdateHamburguesa}
                />

                {/* Campo de precio total */}
                {hamburguesas.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Precio Total de Entrega</CardTitle>
                      <CardDescription>
                        {hamburguesas.some(h => h.precio) 
                          ? '✓ Calculado automáticamente desde los precios de los productos. Puedes modificarlo si es necesario.'
                          : 'Ingresa el monto total a cobrar por esta entrega'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Input
                        type="number"
                        placeholder="Ej: 50000"
                        value={precioTotal}
                        onChange={(e) => {
                          setPrecioTotal(e.target.value);
                          setPrecioManualmenteEditado(true);
                        }}
                      />
                      {precioTotal && (
                        <p className="text-sm font-medium text-primary">
                          Total: {formatCurrency(parseFloat(precioTotal))}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Botón guardar */}
                {hamburguesas.length > 0 && precioTotal && (
                  <Button
                    onClick={handleSaveDelivery}
                    size="lg"
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Entrega
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Resumen */}
          <div>
            {selectedClient && hamburguesas.length > 0 && (
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-base">Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-semibold">{selectedClient.nombre}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Hamburguesas ({hamburguesas.length})
                    </p>
                    <div className="space-y-2">
                      {hamburguesas.map((h) => (
                        <div
                          key={h.id}
                          className="flex justify-between text-sm border-b pb-2 last:border-0"
                        >
                          <div>
                            <div className="font-medium">{h.cantidad} u. x {h.gramaje}g</div>
                            {h.descripcion && (
                              <div className="text-xs text-muted-foreground">
                                {h.descripcion}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">
                      Fecha
                    </p>
                    <p className="font-semibold">
                      {format(parseDateLocal(selectedDate), 'PPP', { locale: es })}
                    </p>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-1">
                      Total Unidades
                    </p>
                    <p className="text-xl font-bold">
                      {hamburguesas.reduce((acc, h) => acc + h.cantidad, 0)} unidades
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      {hamburguesas.reduce((acc, h) => acc + h.cantidad * h.gramaje, 0)}g
                    </p>
                  </div>

                  {precioTotal && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground mb-1">
                        Precio Total
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(parseFloat(precioTotal))}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Agenda de entregas agrupada por días */}
        {sortedDays.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Entregas Agendadas</h2>
              <p className="text-sm text-muted-foreground">
                {sortedDays.length} días con entregas
              </p>
            </div>
            {currentDays.map((dayKey) => {
              const dayDeliveries = deliveriesByDay[dayKey];
              const dayDate = parseDateLocal(dayKey);
              const totalUnidades = dayDeliveries.reduce(
                (acc, delivery) =>
                  acc +
                  delivery.hamburguesas.reduce((sum, h) => sum + h.cantidad, 0),
                0
              );
              const totalGramos = dayDeliveries.reduce(
                (acc, delivery) =>
                  acc +
                  delivery.hamburguesas.reduce(
                    (sum, h) => sum + h.cantidad * h.gramaje,
                    0
                  ),
                0
              );
              const totalPrecio = dayDeliveries.reduce(
                (acc, delivery) => acc + delivery.precioTotal,
                0
              );

              return (
                <Card key={dayKey}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>
                          {format(dayDate, 'EEEE, d MMMM', { locale: es })}
                        </CardTitle>
                        <CardDescription>
                          {dayDeliveries.length} entregas programadas
                        </CardDescription>
                      </div>
                      <div className="text-right space-y-1">
                        <div>
                          <Badge variant="default" className="mr-2">
                            {totalUnidades} u.
                          </Badge>
                          <Badge variant="secondary">
                            {totalGramos}g
                          </Badge>
                        </div>
                        <div className="text-lg font-bold text-primary">
                          {formatCurrency(totalPrecio)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {dayDeliveries.map((delivery) => {
                        const client = clients.find(
                          (c) => c.id === delivery.clientId
                        );
                        const dayTotalUnidades = delivery.hamburguesas.reduce(
                          (sum, h) => sum + h.cantidad,
                          0
                        );
                        const dayTotalGramos = delivery.hamburguesas.reduce(
                          (sum, h) => sum + h.cantidad * h.gramaje,
                          0
                        );

                        return (
                          <div
                            key={delivery.id}
                            className="border rounded-lg p-4 bg-muted/50"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold">
                                  {client?.nombre}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {client?.telefono}
                                </p>
                              </div>
                              <div className="text-right space-y-1">
                                <div>
                                  <Badge className="mr-2">
                                    {dayTotalUnidades} u.
                                  </Badge>
                                  <Badge variant="outline">
                                    {dayTotalGramos}g
                                  </Badge>
                                </div>
                                <div className="text-lg font-bold text-primary">
                                  {formatCurrency(delivery.precioTotal)}
                                </div>
                              </div>
                            </div>

                            <div className="rounded-lg border overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted">
                                    <TableHead className="text-xs">
                                      Unidades
                                    </TableHead>
                                    <TableHead className="text-xs">
                                      Gramaje
                                    </TableHead>
                                    <TableHead className="text-xs">
                                      Descripción
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {delivery.hamburguesas.map((h) => (
                                    <TableRow key={h.id}>
                                      <TableCell className="text-sm font-medium">
                                        {h.cantidad}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {h.gramaje}g
                                      </TableCell>
                                      <TableCell className="text-sm text-muted-foreground">
                                        {h.descripcion || '-'}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setRescheduleDialog({
                                    open: true,
                                    delivery,
                                    clientName: client?.nombre || '',
                                  })
                                }
                              >
                                <CalendarClock className="h-4 w-4 mr-2" />
                                Reagendar
                              </Button>
                              <Link to={`/factura/${delivery.id}`}>
                                <Button variant="outline" size="sm">Ver Factura</Button>
                              </Link>
                              <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/deliveries/${delivery.id}/invoice.pdf`} target="_blank" rel="noreferrer">
                                <Button variant="ghost" size="sm">Descargar PDF</Button>
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} - {Math.min(endIndex, sortedDays.length)} de {sortedDays.length} días
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => goToPage(currentPage - 1)}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => goToPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <PaginationItem key={page}>
                            <span className="px-2">...</span>
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => goToPage(currentPage + 1)}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Diálogo de reagendar */}
      {rescheduleDialog.delivery && (
        <RescheduleDeliveryDialog
          delivery={rescheduleDialog.delivery}
          clientName={rescheduleDialog.clientName}
          open={rescheduleDialog.open}
          onOpenChange={(open) =>
            setRescheduleDialog({ ...rescheduleDialog, open })
          }
        />
      )}
    </div>
  );
};

export default DeliveryPage;
