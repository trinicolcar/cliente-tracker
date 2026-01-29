import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import { deliveriesService } from '@/services/deliveries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Función auxiliar para parsear fechas en hora local
const parseDateLocal = (dateString: string | Date): Date => {
  if (dateString instanceof Date) return dateString;
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
};

interface RescheduleDeliveryDialogProps {
  delivery: {
    id: string;
    fecha: string | Date;
    clientId: string;
  };
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RescheduleDeliveryDialog({
  delivery,
  clientName,
  open,
  onOpenChange,
}: RescheduleDeliveryDialogProps) {
  const queryClient = useQueryClient();
  const currentDate = parseDateLocal(delivery.fecha);
  const [newDate, setNewDate] = useState<string>(
    format(currentDate, 'yyyy-MM-dd')
  );

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, fecha }: { id: string; fecha: Date }) =>
      deliveriesService.reschedule(id, fecha),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Entrega reagendada exitosamente');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Error al reagendar la entrega');
    },
  });

  const handleReschedule = () => {
    if (!newDate) {
      toast.error('Por favor selecciona una fecha');
      return;
    }

    // Convertir la fecha seleccionada a hora local
    const [year, month, day] = newDate.split('-').map(Number);
    const fechaLocal = new Date(year, month - 1, day);

    rescheduleMutation.mutate({
      id: delivery.id,
      fecha: fechaLocal,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reagendar Entrega</DialogTitle>
          <DialogDescription>
            Cambia la fecha de entrega para {clientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Fecha Actual</Label>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(currentDate, 'PPP', { locale: es })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newDate">Nueva Fecha</Label>
            <Input
              id="newDate"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={rescheduleMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleReschedule}
            disabled={rescheduleMutation.isPending || !newDate}
          >
            {rescheduleMutation.isPending ? 'Reagendando...' : 'Reagendar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
