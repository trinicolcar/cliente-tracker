import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Client } from '@/types/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ClientComboboxProps {
  clients: Client[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function ClientCombobox({
  clients,
  value,
  onValueChange,
  placeholder = 'Buscar cliente...',
}: ClientComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedClient = clients.find((client) => client.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedClient ? (
            <span className="truncate">{selectedClient.nombre}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar por nombre, teléfono..." />
          <CommandEmpty>No se encontró ningún cliente.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {clients.map((client) => (
              <CommandItem
                key={client.id}
                value={client.id}
                keywords={[client.nombre, client.telefono, client.direccion]}
                onSelect={() => {
                  onValueChange(client.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === client.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div className="flex flex-col">
                  <span className="font-medium">{client.nombre}</span>
                  <span className="text-xs text-muted-foreground">
                    {client.telefono} • {client.direccion}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
