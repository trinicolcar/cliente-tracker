import { useState } from 'react';
import { Plus, Users, Search } from 'lucide-react';
import { Client, ClientFormData } from '@/types/client';
import { mockClients } from '@/data/mockClients';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { ClientFormDialog } from '@/components/clients/ClientFormDialog';
import { DeleteClientDialog } from '@/components/clients/DeleteClientDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Index = () => {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const filteredClients = clients.filter(
    (client) =>
      client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telefono.includes(searchTerm) ||
      client.direccion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateClient = () => {
    setSelectedClient(null);
    setFormDialogOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setFormDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    const client = clients.find((c) => c.id === id);
    if (client) {
      setClientToDelete(client);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (clientToDelete) {
      setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
      toast.success(`Cliente "${clientToDelete.nombre}" eliminado`);
      setClientToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleSaveClient = (data: ClientFormData) => {
    if (selectedClient) {
      // Editar
      setClients((prev) =>
        prev.map((c) =>
          c.id === selectedClient.id ? { ...data, id: selectedClient.id } : c
        )
      );
      toast.success('Cliente actualizado correctamente');
    } else {
      // Crear
      const newClient: Client = {
        ...data,
        id: String(Date.now()),
      };
      setClients((prev) => [...prev, newClient]);
      toast.success('Cliente creado correctamente');
    }
  };

  const activeClients = clients.filter((c) => c.activo).length;
  const totalBalance = clients.reduce((acc, c) => acc + c.estadoCuenta, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Gestión de Clientes</h1>
              <p className="text-sm text-muted-foreground">
                Sistema de administración de pedidos
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Total Clientes</p>
            <p className="text-2xl font-semibold">{clients.length}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Clientes Activos</p>
            <p className="text-2xl font-semibold text-success">{activeClients}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Balance Total</p>
            <p
              className={`text-2xl font-semibold ${
                totalBalance > 0
                  ? 'text-warning'
                  : totalBalance < 0
                  ? 'text-destructive'
                  : 'text-success'
              }`}
            >
              {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
              }).format(totalBalance)}
            </p>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, teléfono o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={handleCreateClient}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>

        {/* Table */}
        <ClientsTable
          clients={filteredClients}
          onEdit={handleEditClient}
          onDelete={handleDeleteClick}
        />
      </main>

      {/* Dialogs */}
      <ClientFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        client={selectedClient}
        onSave={handleSaveClient}
      />

      <DeleteClientDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        clientName={clientToDelete?.nombre}
      />
    </div>
  );
};

export default Index;
