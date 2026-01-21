import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import Index from "./pages/Index";
import DeliveryPage from "./pages/Delivery";
import PagosPage from "./pages/Pagos";
import EstadoCuentaPage from "./pages/EstadoCuenta";
import ReportesPage from "./pages/Reportes";
import InvoicePage from "./pages/Invoice";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navigation />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/entregas" element={<DeliveryPage />} />
            <Route path="/pagos" element={<PagosPage />} />
            <Route path="/estado-cuenta" element={<EstadoCuentaPage />} />
            <Route path="/reportes" element={<ReportesPage />} />
            <Route path="/factura/:id" element={<InvoicePage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
