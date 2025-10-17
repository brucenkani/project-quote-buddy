import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText } from 'lucide-react';

export default function CustomReports() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/calculators')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Custom Reports</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardHeader>
            <CardTitle>Custom Dashboards</CardTitle>
            <CardDescription>Build tailored reports for your business</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Create custom analytics dashboards</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
