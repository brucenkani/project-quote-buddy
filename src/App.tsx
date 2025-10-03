import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QuoteBuilder } from '@/components/QuoteBuilder';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import AccountingDashboard from "./pages/AccountingDashboard";
import PayrollDashboard from "./pages/PayrollDashboard";
import Settings from "./pages/Settings";
import Invoices from "./pages/Invoices";
import InvoiceBuilder from "./pages/InvoiceBuilder";
import InvoicePayment from "./pages/InvoicePayment";
import InvoicePreview from "./pages/InvoicePreview";
import InvoicePrint from "./pages/InvoicePrint";
import InvoiceEmail from "./pages/InvoiceEmail";
import InvoiceHistory from "./pages/InvoiceHistory";
import InvoiceCreditNote from "./pages/InvoiceCreditNote";
import InvoiceDeliveryNote from "./pages/InvoiceDeliveryNote";
import RecurringInvoices from "./pages/RecurringInvoices";
import RecurringInvoiceBuilder from "./pages/RecurringInvoiceBuilder";
import Statements from "./pages/Statements";
import Inventory from "./pages/Inventory";
import Journal from "./pages/Journal";
import Expenses from "./pages/Expenses";
import ExpensePreview from "./pages/ExpensePreview";
import ExpensePrint from "./pages/ExpensePrint";
import ExpensePayment from "./pages/ExpensePayment";
import ExpenseHistory from "./pages/ExpenseHistory";
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
          <Route path="/auth" element={<Auth />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/accounting" element={<AccountingDashboard />} />
          <Route path="/payroll" element={<PayrollDashboard />} />
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
          <Route path="/invoices/:id/credit-note" element={<InvoiceCreditNote />} />
          <Route path="/invoices/:id/delivery-note" element={<InvoiceDeliveryNote />} />
          <Route path="/invoices/:id/history" element={<InvoiceHistory />} />
            <Route path="/invoices/recurring" element={<RecurringInvoices />} />
            <Route path="/invoices/recurring/new" element={<RecurringInvoiceBuilder />} />
            <Route path="/invoices/statements" element={<Statements />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/expenses/:id/preview" element={<ExpensePreview />} />
          <Route path="/expenses/:id/print" element={<ExpensePrint />} />
          <Route path="/expenses/:id/payment" element={<ExpensePayment />} />
          <Route path="/expenses/:id/history" element={<ExpenseHistory />} />
          <Route path="/expenses/:id" element={<Expenses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
