import { Client } from '@/types/client';
import { ClientCombobox } from '@/components/ClientCombobox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, MapPin } from 'lucide-react';

interface ClientSelectorProps {
  clients: Client[];
  selectedClient: Client | null;
  onClientSelect: (client: Client) => void;
}

export function ClientSelector({
  clients,
  selectedClient,
  onClientSelect,
}: ClientSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">
          Seleccionar Cliente
        </label>
        <ClientCombobox
          clients={clients.filter((c) => c.activo)}
          value={selectedClient?.id || ''}
          onValueChange={(value) => {
            const client = clients.find((c) => c.id === value);
            if (client) {
              onClientSelect(client);
            }
          }}
          placeholder="Buscar cliente..."
        />
      </div>

      {selectedClient && (
        <Card className="bg-muted/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{selectedClient.nombre}</CardTitle>
            <CardDescription>Información del cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{selectedClient.telefono}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{selectedClient.direccion}</span>
            </div>
            <div className="flex items-center gap-2 text-sm pt-2">
              <span className="text-muted-foreground">Estado:</span>
              <Badge
                variant={
                  selectedClient.estadoCuenta === 0 ? 'secondary' : 'outline'
                }
              >
                {selectedClient.estadoCuenta > 0
                  ? `Debe: $${selectedClient.estadoCuenta.toLocaleString('es-CO')}`
                  : selectedClient.estadoCuenta < 0
                    ? `Crédito: $${Math.abs(selectedClient.estadoCuenta).toLocaleString('es-CO')}`
                    : 'Al día'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
