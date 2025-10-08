import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Wrench } from 'lucide-react';

export default function EngineeringCalculators() {
  const navigate = useNavigate();
  const [projectCost, setProjectCost] = useState({ materials: '', labor: '', overhead: '', result: null as any });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/calculators')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Wrench className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Engineering Calculators</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Project Cost Calculator</CardTitle>
            <CardDescription>Estimate total project costs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Materials (R)</Label>
                <Input type="number" value={projectCost.materials} onChange={(e) => setProjectCost({...projectCost, materials: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Labor (R)</Label>
                <Input type="number" value={projectCost.labor} onChange={(e) => setProjectCost({...projectCost, labor: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Overhead (R)</Label>
                <Input type="number" value={projectCost.overhead} onChange={(e) => setProjectCost({...projectCost, overhead: e.target.value})} />
              </div>
            </div>
            <Button onClick={() => {
              const total = parseFloat(projectCost.materials || '0') + parseFloat(projectCost.labor || '0') + parseFloat(projectCost.overhead || '0');
              setProjectCost({...projectCost, result: { total }});
            }} className="w-full">Calculate</Button>
            {projectCost.result && (
              <div className="p-4 bg-primary/5 rounded-lg">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Project Cost:</span>
                  <span className="text-primary">R {projectCost.result.total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
