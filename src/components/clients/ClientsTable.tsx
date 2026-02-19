import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit, Trash2, Phone, MapPin } from 'lucide-react';
import { Client } from '@/types/client';
import { Delivery } from '@/types/delivery';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface ClientsTableProps {
  clients: Client[];
  deliveries: Delivery[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

export function ClientsTable({ clients, deliveries, onEdit, onDelete }: ClientsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getClientTotalDeliveries = (clientId: string) => {
    return deliveries
      .filter((d) => d.clientId === clientId)
      .reduce((acc, d) => acc + d.precioTotal, 0);
  };

  // Devuelve clases de color de fondo y texto según el estado de cuenta
  const getAccountStatusColor = (value: number) => {
    if (value > 0) return 'bg-red-100 text-red-700 border border-red-300'; // Deuda
    if (value < 0) return 'bg-green-100 text-green-700 border border-green-300'; // Saldo a favor
    return 'bg-gray-100 text-gray-500 border border-gray-200'; // Al día
  };

  // Paginación
  const totalPages = Math.ceil(clients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClients = clients.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="text-center">Porciones</TableHead>
              <TableHead>Próxima Entrega</TableHead>
              <TableHead className="text-right">Pedidos</TableHead>
              <TableHead className="text-right">Cuenta</TableHead>
              <TableHead className="text-center w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentClients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-32 text-center text-muted-foreground"
                >
                  No hay clientes registrados
                </TableCell>
              </TableRow>
            ) : (
              currentClients.map((client) => (
              <TableRow key={client.id} className="group">
                <TableCell className="font-mono text-xs text-muted-foreground">
                  #{client.id}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">{client.nombre}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[200px]">
                        {client.direccion}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={client.activo ? 'default' : 'secondary'}
                    className={
                      client.activo
                        ? 'bg-success hover:bg-success/90'
                        : 'bg-muted'
                    }
                  >
                    {client.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{client.telefono}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="font-medium">
                        {client.totalPorciones}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {client.porComida} por comida × {client.alDia} al día ×{' '}
                        {client.duracionPedido} días
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {format(client.proximaEntrega, 'dd MMM yyyy', {
                      locale: es,
                    })}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Tooltip>
                    <TooltipTrigger className="font-medium">
                      {formatCurrency(getClientTotalDeliveries(client.id))}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total de entregas registradas</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className={`inline-block px-2 py-1 rounded-md font-semibold text-sm ${getAccountStatusColor(client.estadoCuenta)}`}>
                        {formatCurrency(client.estadoCuenta)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Saldo pendiente</p>
                      <p className="text-xs">
                        {client.estadoCuenta > 0
                          ? 'Debe pagar'
                          : client.estadoCuenta < 0
                            ? 'Crédito a favor'
                            : 'Al día'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(client)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDelete(client.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>

    {/* Paginación */}
    {totalPages > 1 && (
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {startIndex + 1} - {Math.min(endIndex, clients.length)} de {clients.length} clientes
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
              // Mostrar solo algunas páginas alrededor de la actual
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
  );
}
