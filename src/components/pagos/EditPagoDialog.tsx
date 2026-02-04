import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Edit2 } from 'lucide-react';
import { pagosService } from '@/services/pagos';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EditPagoDialogProps {
  pago: {
    id: string;
    fechaPago: string | Date;
    monto: number;
    metodo?: string;
    descripcion?: string;
  };
}

const parseDateLocal = (dateString: string | Date): Date => {
  if (dateString instanceof Date) return dateString;
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
};

export function EditPagoDialog({ pago }: EditPagoDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [fechaPago, setFechaPago] = useState<Date>(parseDateLocal(pago.fechaPago));
  const [monto, setMonto] = useState(pago.monto.toString());
  const [metodo, setMetodo] = useState<string>(pago.metodo || 'efectivo');
  const [descripcion, setDescripcion] = useState(pago.descripcion || '');

  const updatePagoMutation = useMutation({
    mutationFn: (data: any) => pagosService.update(pago.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Pago actualizado exitosamente');
      setOpen(false);
    },
    onError: () => {
      toast.error('Error al actualizar el pago');
    },
  });

  const handleSubmit = () => {
    const montoValue = parseFloat(monto);
    
    if (isNaN(montoValue) || montoValue <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    updatePagoMutation.mutate({
      fechaPago,
      monto: montoValue,
      metodo,
      descripcion: descripcion.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Pago</DialogTitle>
          <DialogDescription>
            Modifica los detalles del pago registrado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Fecha del Pago */}
          <div className="space-y-2">
            <Label htmlFor="fechaPago">Fecha del Pago</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !fechaPago && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fechaPago ? format(fechaPago, 'PPP') : <span>Seleccionar fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fechaPago}
                  onSelect={(date) => date && setFechaPago(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="monto">Monto</Label>
            <Input
              id="monto"
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="Ej: 50000"
            />
          </div>

          {/* Método de Pago */}
          <div className="space-y-2">
            <Label htmlFor="metodo">Método de Pago</Label>
            <Select value={metodo} onValueChange={setMetodo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (Opcional)</Label>
            <Input
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Notas del pago"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={updatePagoMutation.isPending}>
            {updatePagoMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
