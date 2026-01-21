import { Link, useLocation } from 'react-router-dom';
import { Users, Package, DollarSign, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const location = useLocation();

  return (
    <div className="border-b bg-card sticky top-0 z-40">
      <div className="container flex h-14 items-center gap-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Users className="h-4 w-4 text-primary-foreground" />
          </div>
          <span>Tracker</span>
        </Link>

        <nav className="flex gap-2">
          <Link to="/">
            <Button
              variant={location.pathname === '/' ? 'default' : 'ghost'}
              size="sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Clientes
            </Button>
          </Link>
          <Link to="/entregas">
            <Button
              variant={location.pathname === '/entregas' ? 'default' : 'ghost'}
              size="sm"
            >
              <Package className="h-4 w-4 mr-2" />
              Entregas
            </Button>
          </Link>
          <Link to="/pagos">
            <Button
              variant={location.pathname === '/pagos' ? 'default' : 'ghost'}
              size="sm"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Pagos
            </Button>
          </Link>
          <Link to="/estado-cuenta">
            <Button
              variant={location.pathname === '/estado-cuenta' ? 'default' : 'ghost'}
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Estado de Cuenta
            </Button>
          </Link>
        </nav>
      </div>
    </div>
  );
}
