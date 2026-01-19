import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Client, ClientFormData } from '@/types/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSave: (data: ClientFormData) => void;
}

const defaultFormData: ClientFormData = {
  fechaInicial: new Date(),
  mes: '',
  nombre: '',
  activo: true,
  telefono: '',
  porComida: 0,
  alDia: 0,
  porPedido: 0,
  totalPorciones: 0,
  duracionPedido: 14,
  proximaEntrega: new Date(),
  valorKg: 0,
  valorPedido: 0,
  direccion: '',
  coordenadas: { lat: 0, lng: 0 },
  estadoCuenta: 0,
};

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  onSave,
}: ClientFormDialogProps) {
  const [formData, setFormData] = useState<ClientFormData>(defaultFormData);

  useEffect(() => {
    if (client) {
      const { id, ...rest } = client;
      setFormData(rest);
    } else {
      setFormData(defaultFormData);
    }
  }, [client, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  const updateField = <K extends keyof ClientFormData>(
    field: K,
    value: ClientFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {client ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Información básica */}
          <div className="space-y-4">
            <h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
              Información Básica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => updateField('nombre', e.target.value)}
                  placeholder="Nombre completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => updateField('telefono', e.target.value)}
                  placeholder="+57 300 000 0000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => updateField('direccion', e.target.value)}
                  placeholder="Dirección completa"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mes">Mes</Label>
                <Input
                  id="mes"
                  value={formData.mes}
                  onChange={(e) => updateField('mes', e.target.value)}
                  placeholder="Ej: Enero"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.fechaInicial && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.fechaInicial
                        ? format(formData.fechaInicial, 'PPP')
                        : 'Seleccionar fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.fechaInicial}
                      onSelect={(date) =>
                        date && updateField('fechaInicial', date)
                      }
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center space-x-3 pt-6">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => updateField('activo', checked)}
                />
                <Label htmlFor="activo">Cliente Activo</Label>
              </div>
            </div>
          </div>

          {/* Detalles del pedido */}
          <div className="space-y-4">
            <h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
              Detalles del Pedido
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="porComida">Por Comida</Label>
                <Input
                  id="porComida"
                  type="number"
                  value={formData.porComida}
                  onChange={(e) =>
                    updateField('porComida', parseInt(e.target.value) || 0)
                  }
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alDia">Al Día</Label>
                <Input
                  id="alDia"
                  type="number"
                  value={formData.alDia}
                  onChange={(e) =>
                    updateField('alDia', parseInt(e.target.value) || 0)
                  }
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="porPedido">Por Pedido</Label>
                <Input
                  id="porPedido"
                  type="number"
                  value={formData.porPedido}
                  onChange={(e) =>
                    updateField('porPedido', parseInt(e.target.value) || 0)
                  }
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalPorciones">Total Porciones</Label>
                <Input
                  id="totalPorciones"
                  type="number"
                  value={formData.totalPorciones}
                  onChange={(e) =>
                    updateField('totalPorciones', parseInt(e.target.value) || 0)
                  }
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duracionPedido">Duración (días)</Label>
                <Input
                  id="duracionPedido"
                  type="number"
                  value={formData.duracionPedido}
                  onChange={(e) =>
                    updateField('duracionPedido', parseInt(e.target.value) || 0)
                  }
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label>Próxima Entrega</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.proximaEntrega && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.proximaEntrega
                        ? format(formData.proximaEntrega, 'PPP')
                        : 'Seleccionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.proximaEntrega}
                      onSelect={(date) =>
                        date && updateField('proximaEntrega', date)
                      }
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="space-y-4">
            <h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
              Valores
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valorKg">Valor por Kg ($)</Label>
                <Input
                  id="valorKg"
                  type="number"
                  value={formData.valorKg}
                  onChange={(e) =>
                    updateField('valorKg', parseInt(e.target.value) || 0)
                  }
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valorPedido">Valor Pedido ($)</Label>
                <Input
                  id="valorPedido"
                  type="number"
                  value={formData.valorPedido}
                  onChange={(e) =>
                    updateField('valorPedido', parseInt(e.target.value) || 0)
                  }
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estadoCuenta">Estado de Cuenta ($)</Label>
                <Input
                  id="estadoCuenta"
                  type="number"
                  value={formData.estadoCuenta}
                  onChange={(e) =>
                    updateField('estadoCuenta', parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </div>

          {/* Coordenadas */}
          <div className="space-y-4">
            <h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
              Ubicación
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">Latitud</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  value={formData.coordenadas.lat}
                  onChange={(e) =>
                    updateField('coordenadas', {
                      ...formData.coordenadas,
                      lat: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lng">Longitud</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  value={formData.coordenadas.lng}
                  onChange={(e) =>
                    updateField('coordenadas', {
                      ...formData.coordenadas,
                      lng: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {client ? 'Guardar Cambios' : 'Crear Cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
