import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QuoteBuilder } from '@/components/QuoteBuilder';
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import Invoices from "./pages/Invoices";
import InvoiceBuilder from "./pages/InvoiceBuilder";
import InvoicePayment from "./pages/InvoicePayment";
import InvoicePreview from "./pages/InvoicePreview";
import InvoicePrint from "./pages/InvoicePrint";
import InvoiceEmail from "./pages/InvoiceEmail";
import InvoiceHistory from "./pages/InvoiceHistory";
import Inventory from "./pages/Inventory";
import Journal from "./pages/Journal";
import Expenses from "./pages/Expenses";
import NotFound from "./pages/NotFound";
import Reports from "./pages/Reports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/quotes" element={<QuoteBuilder />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/new" element={<InvoiceBuilder />} />
          <Route path="/invoices/:id" element={<InvoiceBuilder />} />
          <Route path="/invoices/:id/payment" element={<InvoicePayment />} />
          <Route path="/invoices/:id/preview" element={<InvoicePreview />} />
          <Route path="/invoices/:id/print" element={<InvoicePrint />} />
          <Route path="/invoices/:id/email" element={<InvoiceEmail />} />
          <Route path="/invoices/:id/receipt" element={<InvoicePayment />} />
          <Route path="/invoices/:id/history" element={<InvoiceHistory />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
