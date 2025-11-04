import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { ArrowLeft, Clock } from 'lucide-react';
import { loadExpenses } from '@/utils/accountingStorage';
import { Expense } from '@/types/accounting';

export default function ExpenseHistory() {
  const navigate = useNavigate();
  const { id } = useParams();
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

  const history = [
    {
      id: '1',
      date: expense.createdAt,
      action: 'Expense Created',
      details: `Expense recorded for ${expense.vendor}`,
      user: 'System',
    },
    ...(expense.payments || []).map((payment, idx) => ({
      id: `payment-${idx}`,
      date: payment.date,
      action: 'Payment Recorded',
      details: `Payment of ${payment.amount} via ${payment.method}`,
      user: 'System',
    })),
    {
      id: 'updated',
      date: expense.updatedAt,
      action: 'Last Modified',
      details: 'Expense details updated',
      user: 'System',
    },
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Expense History - {expense.vendor}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.map((event) => (
                <div key={event.id} className="border-l-2 border-primary pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{event.action}</h4>
                      <p className="text-sm text-muted-foreground">{event.details}</p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{new Date(event.date).toLocaleDateString()}</p>
                      <p>{new Date(event.date).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
