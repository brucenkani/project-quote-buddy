import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import ProtectedRoute from "@/components/ProtectedRoute";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import { DataProvider } from "@/contexts/DataProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Subscription from "./pages/Subscription";
import KnowledgeCentre from "./pages/KnowledgeCentre";
import KnowledgeArticle from "./pages/KnowledgeArticle";
import KnowledgeAdmin from "./pages/admin/KnowledgeAdmin";
import SMTPSettings from "./pages/admin/SMTPSettings";
import Landing from "./pages/Landing";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import AccountingDashboard from "./pages/AccountingDashboard";
import PayrollDashboard from "./pages/PayrollDashboard";
import Employees from "./pages/Employees";
import Payroll from "./pages/Payroll";
import LeaveManagement from "./pages/LeaveManagement";
import EMP201 from "./pages/tax-declarations/EMP201";
import EMP501 from "./pages/tax-declarations/EMP501";

import TaxComplianceSettings from "./pages/TaxComplianceSettings";
import Purchases from "./pages/Purchases";
import PurchaseOrders from "./pages/PurchaseOrders";
import PurchaseHistory from "./pages/PurchaseHistory";
import PurchasePreview from "./pages/PurchasePreview";
import PurchasePrint from "./pages/PurchasePrint";
import PurchasePayment from "./pages/PurchasePayment";

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
import BankFeeds from "./pages/BankFeeds";
import BankAccounts from "./pages/BankAccounts";
import NotFound from "./pages/NotFound";
import Reports from "./pages/Reports";
import InviteUsers from "./pages/InviteUsers";
import PermissionsManager from "./pages/PermissionsManager";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import BusinessCommunity from "./pages/BusinessCommunity";
import LandingSettings from "./pages/LandingSettings";
import CRMCustomerSupport from "./pages/CRMCustomerSupport";
import CustomerDatabase from "./pages/crm/CustomerDatabase";
import SalesPipeline from "./pages/crm/SalesPipeline";
import TicketSystem from "./pages/crm/TicketSystem";
import BusinessAnalytics from "./pages/BusinessAnalytics";
import ManagementAccounts from "./pages/analytics/ManagementAccounts";
import FinancialForecasting from "./pages/analytics/FinancialForecasting";
import PerformanceMetrics from "./pages/analytics/PerformanceMetrics";
import VarianceAnalysis from "./pages/analytics/VarianceAnalysis";
import StrategicPlanning from "./pages/analytics/StrategicPlanning";
import CustomReports from "./pages/analytics/CustomReports";
import DashboardBuilder from "./pages/analytics/DashboardBuilder";
import ARAgingReport from "./pages/reports/ARAgingReport";
import APAgingReport from "./pages/reports/APAgingReport";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DataProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
          <Route path="/business-community" element={<BusinessCommunity />} />
          <Route path="/community" element={<BusinessCommunity />} />
          <Route path="/knowledge" element={<KnowledgeCentre />} />
          <Route path="/knowledge/:slug" element={<KnowledgeArticle />} />
          <Route path="/admin/knowledge" element={<ProtectedRoute><KnowledgeAdmin /></ProtectedRoute>} />
          <Route path="/admin/knowledge-admin" element={<ProtectedRoute><KnowledgeAdmin /></ProtectedRoute>} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/crm-customer-support" element={<ProtectedRoute><CRMCustomerSupport /></ProtectedRoute>} />
          <Route path="/crm/customer-database" element={<ProtectedRoute><CustomerDatabase /></ProtectedRoute>} />
          <Route path="/crm/sales-pipeline" element={<ProtectedRoute><SalesPipeline /></ProtectedRoute>} />
          <Route path="/crm/ticket-system" element={<ProtectedRoute><TicketSystem /></ProtectedRoute>} />
          <Route path="/business-analytics" element={<BusinessAnalytics />} />
          <Route path="/analytics" element={<BusinessAnalytics />} />
          <Route path="/analytics/management-accounts" element={<ManagementAccounts />} />
          <Route path="/analytics/financial-forecasting" element={<FinancialForecasting />} />
          <Route path="/analytics/performance-metrics" element={<PerformanceMetrics />} />
          <Route path="/analytics/variance-analysis" element={<VarianceAnalysis />} />
          <Route path="/analytics/strategic-planning" element={<StrategicPlanning />} />
          <Route path="/analytics/custom-reports" element={<ProtectedRoute><CustomReports /></ProtectedRoute>} />
          <Route path="/analytics/dashboard-builder/:id" element={<ProtectedRoute><DashboardBuilder /></ProtectedRoute>} />
          
          <Route path="/super-admin" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/smtp-settings" element={<ProtectedRoute><SMTPSettings /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Landing /></ProtectedRoute>} />
          <Route path="/landing" element={<ProtectedRoute><Landing /></ProtectedRoute>} />
          <Route path="/landing-settings" element={<ProtectedRoute><LandingSettings /></ProtectedRoute>} />
          <Route path="/accounting" element={<ProtectedRoute><AccountingDashboard /></ProtectedRoute>} />
          <Route path="/accounting-dashboard" element={<ProtectedRoute><AccountingDashboard /></ProtectedRoute>} />
          <Route path="/payroll-dashboard" element={<ProtectedRoute><PayrollDashboard /></ProtectedRoute>} />
          <Route path="/payroll" element={<ProtectedRoute><PayrollDashboard /></ProtectedRoute>} />
          <Route path="/payroll/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
          <Route path="/payroll/payroll" element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
          <Route path="/payroll/leave" element={<ProtectedRoute><LeaveManagement /></ProtectedRoute>} />
          <Route path="/tax-declarations/emp201" element={<ProtectedRoute><EMP201 /></ProtectedRoute>} />
          <Route path="/tax-declarations/emp501" element={<ProtectedRoute><EMP501 /></ProtectedRoute>} />
          
          
          <Route path="/settings" element={<ProtectedRoute><LandingSettings /></ProtectedRoute>} />
          <Route path="/tax-compliance" element={<ProtectedRoute><TaxComplianceSettings /></ProtectedRoute>} />
          <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
          <Route path="/purchase-orders" element={<ProtectedRoute><PurchaseOrders /></ProtectedRoute>} />
          <Route path="/purchase-history/:id" element={<ProtectedRoute><PurchaseHistory /></ProtectedRoute>} />
          <Route path="/purchase-preview/:id" element={<ProtectedRoute><PurchasePreview /></ProtectedRoute>} />
          <Route path="/purchase-print/:id" element={<ProtectedRoute><PurchasePrint /></ProtectedRoute>} />
          <Route path="/purchase-payment/:id" element={<ProtectedRoute><PurchasePayment /></ProtectedRoute>} />
          
          <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
          <Route path="/invoices/new" element={<ProtectedRoute><InvoiceBuilder /></ProtectedRoute>} />
          <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceBuilder /></ProtectedRoute>} />
          <Route path="/invoices/:id/payment" element={<ProtectedRoute><InvoicePayment /></ProtectedRoute>} />
          <Route path="/invoices/:id/preview" element={<ProtectedRoute><InvoicePreview /></ProtectedRoute>} />
          <Route path="/invoices/:id/print" element={<ProtectedRoute><InvoicePrint /></ProtectedRoute>} />
          <Route path="/invoices/:id/email" element={<ProtectedRoute><InvoiceEmail /></ProtectedRoute>} />
          <Route path="/invoices/:id/receipt" element={<ProtectedRoute><InvoicePayment /></ProtectedRoute>} />
          <Route path="/invoices/:id/credit-note" element={<ProtectedRoute><InvoiceCreditNote /></ProtectedRoute>} />
          <Route path="/invoices/:id/delivery-note" element={<ProtectedRoute><InvoiceDeliveryNote /></ProtectedRoute>} />
          <Route path="/invoices/:id/history" element={<ProtectedRoute><InvoiceHistory /></ProtectedRoute>} />
          <Route path="/invoices/recurring" element={<ProtectedRoute><RecurringInvoices /></ProtectedRoute>} />
          <Route path="/invoices/recurring/new" element={<ProtectedRoute><RecurringInvoiceBuilder /></ProtectedRoute>} />
          <Route path="/invoices/statements" element={<ProtectedRoute><Statements /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/expenses/:id/preview" element={<ProtectedRoute><ExpensePreview /></ProtectedRoute>} />
          <Route path="/expenses/:id/print" element={<ProtectedRoute><ExpensePrint /></ProtectedRoute>} />
          <Route path="/expenses/:id/payment" element={<ProtectedRoute><ExpensePayment /></ProtectedRoute>} />
          <Route path="/bank-feeds" element={<ProtectedRoute><BankFeeds /></ProtectedRoute>} />
          <Route path="/bank-accounts" element={<ProtectedRoute><BankAccounts /></ProtectedRoute>} />
          <Route path="/expenses/:id/history" element={<ProtectedRoute><ExpenseHistory /></ProtectedRoute>} />
          <Route path="/expenses/:id" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/reports/ar-aging" element={<ProtectedRoute><ARAgingReport /></ProtectedRoute>} />
          <Route path="/reports/ap-aging" element={<ProtectedRoute><APAgingReport /></ProtectedRoute>} />
          <Route path="/invite" element={<ProtectedRoute><InviteUsers /></ProtectedRoute>} />
          <Route path="/permissions" element={<ProtectedRoute><PermissionsManager /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </DataProvider>
  </QueryClientProvider>
);

export default App;
