import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { loadExpenses } from '@/utils/accountingStorage';
import { useSettings } from '@/contexts/SettingsContext';
import { Expense } from '@/types/accounting';

export default function ExpensePrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [expense, setExpense] = useState<Expense | null>(null);

  useEffect(() => {
    if (id) {
      loadExpenses().then(expenses => {
        const found = expenses.find(exp => exp.id === id);
        if (found) {
          setExpense(found);
        }
      });
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (!expense) {
    return <div className="container mx-auto px-4 py-8">Expense not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex gap-2 mb-4">
          <Button variant="ghost" onClick={() => navigate('/expenses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl print:py-0">
        <div className="bg-white text-black p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">{settings.companyName}</h1>
            {settings.address && <p className="text-sm text-gray-600">{settings.address}</p>}
            {settings.phone && <p className="text-sm text-gray-600">{settings.phone}</p>}
            {settings.email && <p className="text-sm text-gray-600">{settings.email}</p>}
          </div>

          <div className="border-t-2 border-b-2 border-gray-300 py-4 mb-6">
            <h2 className="text-2xl font-bold text-center">EXPENSE VOUCHER</h2>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-bold mb-2">Vendor Details</h3>
              <p><strong>Vendor:</strong> {expense.vendor}</p>
            </div>
            <div>
              <h3 className="font-bold mb-2">Expense Information</h3>
              <p><strong>Reference:</strong> {expense.reference || expense.id.substring(0, 8).toUpperCase()}</p>
              <p><strong>Date:</strong> {new Date(expense.date).toLocaleDateString()}</p>
              {expense.dueDate && (
                <p><strong>Due Date:</strong> {new Date(expense.dueDate).toLocaleDateString()}</p>
              )}
              <p><strong>Category:</strong> {expense.category}</p>
              <p><strong>Payment Method:</strong> {expense.paymentMethod}</p>
            </div>
          </div>

          {expense.description && (
            <div className="mb-6">
              <h3 className="font-bold mb-2">Description</h3>
              <p className="text-gray-700">{expense.description}</p>
            </div>
          )}

          <div className="border-t-2 border-gray-300 pt-4 mt-6">
            <div className="flex justify-between text-xl font-bold">
              <span>Total Amount:</span>
              <span>{settings.currencySymbol}{expense.amount.toFixed(2)}</span>
            </div>
          </div>

          {expense.payments && expense.payments.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="font-bold mb-3">Payment History</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Method</th>
                    <th className="text-left py-2">Reference</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expense.payments.map(payment => (
                    <tr key={payment.id} className="border-b">
                      <td className="py-2">{new Date(payment.date).toLocaleDateString()}</td>
                      <td className="py-2">{payment.method}</td>
                      <td className="py-2">{payment.reference || '-'}</td>
                      <td className="text-right py-2">{settings.currencySymbol}{payment.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-gray-300">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="font-bold mb-2">Prepared by:</p>
                <div className="border-b border-gray-400 mt-8"></div>
                <p className="text-sm text-gray-600 mt-1">Signature</p>
              </div>
              <div>
                <p className="font-bold mb-2">Approved by:</p>
                <div className="border-b border-gray-400 mt-8"></div>
                <p className="text-sm text-gray-600 mt-1">Signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
