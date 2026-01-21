import { useState } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface BulkUploadResult {
  success: boolean;
  created: number;
  errors: number;
  errorDetails: Array<{ line: number; error: string }>;
  clients: Array<{ id: string; nombre: string; telefono: string }>;
}

interface BulkUploadDialogProps {
  onSuccess: () => void;
}

export function BulkUploadDialog({ onSuccess }: BulkUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BulkUploadResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Por favor selecciona un archivo CSV');
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Por favor selecciona un archivo');
      return;
    }

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('http://localhost:3001/api/clients/bulk', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }

      const data: BulkUploadResult = await response.json();
      setResult(data);

      if (data.created > 0) {
        toast.success(`${data.created} clientes creados exitosamente`);
        onSuccess();
      }

      if (data.errors > 0) {
        toast.warning(`${data.errors} filas con errores`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `nombre,telefono,direccion,lat,lng,porComida,alDia,duracionPedido,valorKg
María García López,+57 300 123 4567,"Calle 45 #12-34, Bogotá",4.6097,-74.0817,2,4,14,25000
Carlos Rodríguez,+57 301 234 5678,"Carrera 70 #45-12, Medellín",6.2442,-75.5812,3,6,14,25000
Ana Martínez,+57 302 345 6789,"Avenida 6N #25-40, Cali",3.4516,-76.532,1,2,14,25000`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plantilla_clientes.csv';
    link.click();
    toast.success('Plantilla descargada');
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setResult(null);
    setProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Clientes desde CSV</DialogTitle>
          <DialogDescription>
            Sube un archivo CSV para crear múltiples clientes a la vez
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Descargar plantilla */}
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertTitle>Formato del archivo</AlertTitle>
            <AlertDescription className="space-y-2">
              <p className="text-sm">
                El CSV debe tener las siguientes columnas:
              </p>
              <code className="text-xs block bg-muted p-2 rounded">
                nombre,telefono,direccion,lat,lng,porComida,alDia,duracionPedido,valorKg
              </code>
              <Button
                variant="link"
                size="sm"
                onClick={downloadTemplate}
                className="h-auto p-0"
              >
                <Download className="h-3 w-3 mr-1" />
                Descargar plantilla de ejemplo
              </Button>
            </AlertDescription>
          </Alert>

          {/* Selector de archivo */}
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
              disabled={uploading}
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-12 w-12 text-muted-foreground" />
              {file ? (
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">Haz clic para seleccionar un archivo CSV</p>
                  <p className="text-sm text-muted-foreground">
                    o arrastra y suelta aquí
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* Progreso */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Procesando archivo... {progress}%
              </p>
            </div>
          )}

          {/* Resultados */}
          {result && (
            <div className="space-y-3">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Resumen de importación</AlertTitle>
                <AlertDescription className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-green-600">
                        Creados: {result.created}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-destructive">
                        Errores: {result.errors}
                      </span>
                    </div>
                  </div>

                  {result.clients.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium mb-1">Clientes creados:</p>
                      <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                        {result.clients.map((client) => (
                          <li key={client.id} className="flex justify-between">
                            <span>{client.nombre}</span>
                            <span className="text-muted-foreground">
                              {client.telefono}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.errorDetails.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium mb-1 text-destructive">
                        Errores encontrados:
                      </p>
                      <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                        {result.errorDetails.map((err, idx) => (
                          <li key={idx} className="text-destructive">
                            Línea {err.line}: {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cerrar
            </Button>
            {file && !result && (
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Procesando...' : 'Subir e Importar'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
