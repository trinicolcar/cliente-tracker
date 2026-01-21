import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Hamburguesa } from '@/types/delivery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface ProductFormProps {
  hamburguesas: Hamburguesa[];
  onAddHamburguesa: (hamburguesa: Hamburguesa) => void;
  onRemoveHamburguesa: (hamburgesaId: string) => void;
  onUpdateHamburguesa: (hamburguesa: Hamburguesa) => void;
}

export function ProductForm({
  hamburguesas,
  onAddHamburguesa,
  onRemoveHamburguesa,
  onUpdateHamburguesa,
}: ProductFormProps) {
  const [cantidad, setCantidad] = useState('');
  const [gramaje, setGramaje] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!cantidad.trim() || !gramaje.trim()) {
      return;
    }

    const newHamburguesa: Hamburguesa = {
      id: editingId || String(Date.now()),
      cantidad: parseInt(cantidad),
      gramaje: parseInt(gramaje),
      descripcion: descripcion.trim() || undefined,
    };

    if (editingId) {
      onUpdateHamburguesa(newHamburguesa);
      setEditingId(null);
    } else {
      onAddHamburguesa(newHamburguesa);
    }

    setCantidad('');
    setGramaje('');
    setDescripcion('');
  };

  const handleEdit = (hamburguesa: Hamburguesa) => {
    setCantidad(hamburguesa.cantidad.toString());
    setGramaje(hamburguesa.gramaje.toString());
    setDescripcion(hamburguesa.descripcion || '');
    setEditingId(hamburguesa.id);
  };

  const handleCancel = () => {
    setCantidad('');
    setGramaje('');
    setDescripcion('');
    setEditingId(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? 'Editar Hamburguesa' : 'Agregar Hamburguesa'}
          </CardTitle>
          <CardDescription>
            {editingId
              ? 'Modifica la cantidad, gramaje y precio'
              : 'Agrega hamburguesas a la entrega'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Cantidad
              </label>
              <Input
                type="number"
                placeholder="Ej: 10"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Gramaje (g)
              </label>
              <Input
                type="number"
                placeholder="Ej: 200"
                value={gramaje}
                onChange={(e) => setGramaje(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Descripción (Opcional)
            </label>
            <Input
              placeholder="Ej: Sencilla, Doble, Con queso, etc."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAdd} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              {editingId ? 'Actualizar' : 'Agregar'}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {hamburguesas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Hamburguesas ({hamburguesas.length})
            </CardTitle>
            <CardDescription>
              Total: {hamburguesas.reduce((acc, h) => acc + h.cantidad, 0)} unidades | {hamburguesas.reduce((acc, h) => acc + h.gramaje * h.cantidad, 0)}g
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Unidades</TableHead>
                    <TableHead>Gramaje</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hamburguesas.map((hamburguesa) => (
                    <TableRow key={hamburguesa.id}>
                      <TableCell className="font-medium">
                        <Badge variant="secondary">
                          {hamburguesa.cantidad}
                        </Badge>
                      </TableCell>
                      <TableCell>{hamburguesa.gramaje}g</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {hamburguesa.descripcion || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(hamburguesa)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveHamburguesa(hamburguesa.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
