import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { ArrowLeft, Printer, Mail } from 'lucide-react';
import { loadExpenses } from '@/utils/accountingStorage';
import { Expense } from '@/types/accounting';
import { useSettings } from '@/contexts/SettingsContext';
import { Badge } from '@/components/ui/badge';

export default function ExpensePreview() {
  const navigate = useNavigate();
  const { id } = useParams();
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

  if (!expense) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p>Expense not found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: Expense['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'partly-paid': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'approved': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'overdue': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'rejected': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default: return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/expenses')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Expenses
        </Button>

        <div className="flex gap-2 mb-6">
          <Button variant="outline" className="gap-2" onClick={() => navigate(`/expenses/${id}/print`)}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">Expense Details</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Reference: {expense.reference || expense.id.substring(0, 8).toUpperCase()}
                </p>
              </div>
              <Badge className={getStatusColor(expense.status)}>{expense.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Vendor Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Vendor:</strong> {expense.vendor}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Expense Details</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Category:</strong> {expense.category}</p>
                  <p><strong>Date:</strong> {new Date(expense.date).toLocaleDateString()}</p>
                  {expense.dueDate && (
                    <p><strong>Due Date:</strong> {new Date(expense.dueDate).toLocaleDateString()}</p>
                  )}
                  <p><strong>Payment Method:</strong> {expense.paymentMethod}</p>
                </div>
              </div>
            </div>

            {expense.description && (
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{expense.description}</p>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-primary">{settings.currencySymbol}{expense.amount.toFixed(2)}</span>
              </div>
              
              {expense.payments && expense.payments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold">Payments Made</h4>
                  {expense.payments.map(payment => (
                    <div key={payment.id} className="flex justify-between text-sm">
                      <span>{new Date(payment.date).toLocaleDateString()} - {payment.method}</span>
                      <span className="text-green-600">-{settings.currencySymbol}{payment.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
