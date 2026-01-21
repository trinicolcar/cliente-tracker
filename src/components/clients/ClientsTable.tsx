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

interface ClientsTableProps {
  clients: Client[];
  deliveries: Delivery[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

export function ClientsTable({ clients, deliveries, onEdit, onDelete }: ClientsTableProps) {
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

  const getAccountStatusColor = (value: number) => {
    if (value > 0) return 'text-destructive';
    if (value < 0) return 'text-green-600';
    return 'text-muted-foreground';
  };

  return (
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
          {clients.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9}
                className="h-32 text-center text-muted-foreground"
              >
                No hay clientes registrados
              </TableCell>
            </TableRow>
          ) : (
            clients.map((client) => (
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
                <TableCell
                  className={`text-right font-medium ${getAccountStatusColor(
                    client.estadoCuenta
                  )}`}
                >
                  <Tooltip>
                    <TooltipTrigger>
                      {formatCurrency(client.estadoCuenta)}
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
  );
}
