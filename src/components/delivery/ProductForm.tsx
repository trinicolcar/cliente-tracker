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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [tipo, setTipo] = useState<'hamburguesa' | 'nuggets'>('hamburguesa');
  const [cantidad, setCantidad] = useState('');
  const [gramaje, setGramaje] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!cantidad.trim() || !gramaje.trim()) {
      return;
    }

    const newProduct: Hamburguesa = {
      id: editingId || String(Date.now()),
      tipo,
      cantidad: parseInt(cantidad),
      gramaje: parseFloat(gramaje),
      precio: precio.trim() ? parseFloat(precio) : undefined,
      descripcion: descripcion.trim() || undefined,
    };

    if (editingId) {
      onUpdateHamburguesa(newProduct);
      setEditingId(null);
    } else {
      onAddHamburguesa(newProduct);
    }

    setTipo('hamburguesa');
    setCantidad('');
    setGramaje('');
    setPrecio('');
    setDescripcion('');
  };

  const handleEdit = (product: Hamburguesa) => {
    setTipo(product.tipo || 'hamburguesa');
    setCantidad(product.cantidad.toString());
    setGramaje(product.gramaje.toString());
    setPrecio(product.precio?.toString() || '');
    setDescripcion(product.descripcion || '');
    setEditingId(product.id);
  };

  const handleCancel = () => {
    setTipo('hamburguesa');
    setCantidad('');
    setGramaje('');
    setPrecio('');
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

  const hamburguesas_list = hamburguesas.filter(h => !h.tipo || h.tipo === 'hamburguesa');
  const nuggets_list = hamburguesas.filter(h => h.tipo === 'nuggets');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? 'Editar Producto' : 'Agregar Producto'}
          </CardTitle>
          <CardDescription>
            {editingId
              ? 'Modifica el tipo, cantidad, gramaje y precio'
              : 'Agrega hamburguesas o nuggets a la entrega'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Tipo de Producto
            </label>
            <Select
              value={tipo}
              onValueChange={(value: 'hamburguesa' | 'nuggets') => setTipo(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hamburguesa">🍔 Hamburguesa</SelectItem>
                <SelectItem value="nuggets">🍗 Nuggets</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {tipo === 'nuggets' ? 'Paquetes' : 'Unidades'}
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
            <div>
              <label className="text-sm font-medium mb-2 block">
                Precio (Opcional)
              </label>
              <Input
                type="number"
                placeholder="Ej: 5000"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Descripción (Opcional)
            </label>
            <Input
              placeholder={tipo === 'nuggets' ? 'Ej: Apanados crujientes' : 'Ej: Sencilla, Doble, Con queso'}
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

      {hamburguesas_list.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              🍔 Hamburguesas ({hamburguesas_list.length})
            </CardTitle>
            <CardDescription>
              Total: {hamburguesas_list.reduce((acc, h) => acc + h.cantidad, 0)} unidades | {hamburguesas_list.reduce((acc, h) => acc + h.gramaje * h.cantidad, 0)}g
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Unidades</TableHead>
                    <TableHead>Gramaje</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hamburguesas_list.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <Badge variant="secondary">
                          {product.cantidad}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.gramaje}g</TableCell>
                      <TableCell>
                        {product.precio ? formatCurrency(product.precio) : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {product.descripcion || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveHamburguesa(product.id)}
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

      {nuggets_list.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              🍗 Nuggets ({nuggets_list.length})
            </CardTitle>
            <CardDescription>
              Total: {nuggets_list.reduce((acc, h) => acc + h.cantidad, 0)} paquetes | {nuggets_list.reduce((acc, h) => acc + h.gramaje * h.cantidad, 0)}g
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Paquetes</TableHead>
                    <TableHead>Gramaje</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nuggets_list.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <Badge variant="secondary">
                          {product.cantidad}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.gramaje}g</TableCell>
                      <TableCell>
                        {product.precio ? formatCurrency(product.precio) : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {product.descripcion || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveHamburguesa(product.id)}
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

