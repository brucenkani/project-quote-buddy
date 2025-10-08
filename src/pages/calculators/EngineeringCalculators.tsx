import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Wrench } from 'lucide-react';

export default function EngineeringCalculators() {
  const navigate = useNavigate();

  // Project Cost States
  const [materials, setMaterials] = useState('');
  const [labor, setLabor] = useState('');
  const [overhead, setOverhead] = useState('');
  const [contingency, setContingency] = useState('10');
  const [projectCostResult, setProjectCostResult] = useState<any>(null);

  // Material Quantity States
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [thickness, setThickness] = useState('');
  const [wasteFactor, setWasteFactor] = useState('10');
  const [materialType, setMaterialType] = useState('concrete');
  const [materialResult, setMaterialResult] = useState<any>(null);

  // Labor Cost States
  const [hourlyRate, setHourlyRate] = useState('');
  const [hoursWorked, setHoursWorked] = useState('');
  const [workers, setWorkers] = useState('');
  const [laborResult, setLaborResult] = useState<any>(null);

  // Unit Conversion States
  const [conversionValue, setConversionValue] = useState('');
  const [fromUnit, setFromUnit] = useState('meters');
  const [toUnit, setToUnit] = useState('feet');
  const [conversionResult, setConversionResult] = useState<any>(null);

  // Project Timeline States
  const [totalTasks, setTotalTasks] = useState('');
  const [avgTaskDuration, setAvgTaskDuration] = useState('');
  const [parallelTasks, setParallelTasks] = useState('');
  const [timelineResult, setTimelineResult] = useState<any>(null);

  const calculateProjectCost = () => {
    const mat = parseFloat(materials) || 0;
    const lab = parseFloat(labor) || 0;
    const over = parseFloat(overhead) || 0;
    const cont = parseFloat(contingency) / 100;

    const subtotal = mat + lab + over;
    const contingencyAmount = subtotal * cont;
    const total = subtotal + contingencyAmount;

    setProjectCostResult({
      materials: mat.toFixed(2),
      labor: lab.toFixed(2),
      overhead: over.toFixed(2),
      subtotal: subtotal.toFixed(2),
      contingency: contingencyAmount.toFixed(2),
      total: total.toFixed(2)
    });
  };

  const calculateMaterialQuantity = () => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    const t = parseFloat(thickness) || 1;
    const waste = parseFloat(wasteFactor) / 100;

    if (isNaN(l) || isNaN(w)) return;

    let volume = l * w * t;
    const wasteAmount = volume * waste;
    const totalVolume = volume + wasteAmount;

    let unit = 'm³';
    let density = 1;

    if (materialType === 'concrete') {
      density = 2400; // kg/m³
      unit = 'kg';
    } else if (materialType === 'steel') {
      density = 7850;
      unit = 'kg';
    } else if (materialType === 'wood') {
      density = 600;
      unit = 'kg';
    }

    const weight = totalVolume * density;

    setMaterialResult({
      volume: volume.toFixed(2),
      wasteAmount: wasteAmount.toFixed(2),
      totalVolume: totalVolume.toFixed(2),
      weight: weight.toFixed(2),
      unit,
      materialType
    });
  };

  const calculateLaborCost = () => {
    const rate = parseFloat(hourlyRate);
    const hours = parseFloat(hoursWorked);
    const numWorkers = parseFloat(workers) || 1;

    if (isNaN(rate) || isNaN(hours)) return;

    const costPerWorker = rate * hours;
    const totalCost = costPerWorker * numWorkers;
    const totalHours = hours * numWorkers;

    setLaborResult({
      hourlyRate: rate.toFixed(2),
      totalHours: totalHours.toFixed(1),
      workers: numWorkers,
      costPerWorker: costPerWorker.toFixed(2),
      totalCost: totalCost.toFixed(2)
    });
  };

  const convertUnits = () => {
    const value = parseFloat(conversionValue);
    if (isNaN(value)) return;

    const conversions: any = {
      'meters-feet': 3.28084,
      'feet-meters': 0.3048,
      'meters-inches': 39.3701,
      'inches-meters': 0.0254,
      'kg-pounds': 2.20462,
      'pounds-kg': 0.453592,
      'celsius-fahrenheit': (v: number) => (v * 9/5) + 32,
      'fahrenheit-celsius': (v: number) => (v - 32) * 5/9,
      'liters-gallons': 0.264172,
      'gallons-liters': 3.78541
    };

    const key = `${fromUnit}-${toUnit}`;
    let result = 0;

    if (typeof conversions[key] === 'function') {
      result = conversions[key](value);
    } else if (conversions[key]) {
      result = value * conversions[key];
    } else {
      result = value; // Same unit
    }

    setConversionResult({
      original: value,
      fromUnit,
      toUnit,
      result: result.toFixed(4)
    });
  };

  const calculateTimeline = () => {
    const tasks = parseFloat(totalTasks);
    const duration = parseFloat(avgTaskDuration);
    const parallel = parseFloat(parallelTasks) || 1;

    if (isNaN(tasks) || isNaN(duration)) return;

    const sequentialDays = tasks * duration;
    const parallelDays = (tasks / parallel) * duration;
    const timeSaved = sequentialDays - parallelDays;

    setTimelineResult({
      totalTasks: tasks,
      sequentialDays: sequentialDays.toFixed(1),
      parallelDays: parallelDays.toFixed(1),
      timeSaved: timeSaved.toFixed(1),
      efficiency: ((timeSaved / sequentialDays) * 100).toFixed(1)
    });
  };

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
        <div className="grid gap-6 max-w-6xl mx-auto">
          {/* Project Cost Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Project Cost Calculator</CardTitle>
              <CardDescription>Estimate total project costs including contingency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Materials Cost (R)</Label>
                  <Input type="number" value={materials} onChange={(e) => setMaterials(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Labor Cost (R)</Label>
                  <Input type="number" value={labor} onChange={(e) => setLabor(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Overhead Cost (R)</Label>
                  <Input type="number" value={overhead} onChange={(e) => setOverhead(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Contingency (%)</Label>
                  <Input type="number" value={contingency} onChange={(e) => setContingency(e.target.value)} />
                </div>
              </div>
              <Button onClick={calculateProjectCost} className="w-full">Calculate Total Cost</Button>
              {projectCostResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Materials:</span>
                    <span>R {projectCostResult.materials}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Labor:</span>
                    <span>R {projectCostResult.labor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overhead:</span>
                    <span>R {projectCostResult.overhead}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Subtotal:</span>
                    <span>R {projectCostResult.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contingency ({contingency}%):</span>
                    <span>R {projectCostResult.contingency}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total Project Cost:</span>
                    <span className="text-primary">R {projectCostResult.total}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Material Quantity Estimator */}
          <Card>
            <CardHeader>
              <CardTitle>Material Quantity Estimator</CardTitle>
              <CardDescription>Calculate required material quantities with waste factor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Length (m)</Label>
                  <Input type="number" value={length} onChange={(e) => setLength(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Width (m)</Label>
                  <Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Thickness/Height (m)</Label>
                  <Input type="number" value={thickness} onChange={(e) => setThickness(e.target.value)} placeholder="1" />
                </div>
                <div className="space-y-2">
                  <Label>Waste Factor (%)</Label>
                  <Input type="number" value={wasteFactor} onChange={(e) => setWasteFactor(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Material Type</Label>
                  <Select value={materialType} onValueChange={setMaterialType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concrete">Concrete</SelectItem>
                      <SelectItem value="steel">Steel</SelectItem>
                      <SelectItem value="wood">Wood</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={calculateMaterialQuantity} className="w-full">Calculate Quantity</Button>
              {materialResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Base Volume:</span>
                    <span>{materialResult.volume} m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waste Amount:</span>
                    <span>{materialResult.wasteAmount} m³</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Volume Required:</span>
                    <span className="text-primary">{materialResult.totalVolume} m³</span>
                  </div>
                  {materialResult.materialType !== 'other' && (
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Estimated Weight:</span>
                      <span>{materialResult.weight} {materialResult.unit}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Labor Cost Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Labor Cost Calculator</CardTitle>
              <CardDescription>Calculate total labor costs for your project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Hourly Rate (R)</Label>
                  <Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Hours per Worker</Label>
                  <Input type="number" value={hoursWorked} onChange={(e) => setHoursWorked(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Number of Workers</Label>
                  <Input type="number" value={workers} onChange={(e) => setWorkers(e.target.value)} placeholder="1" />
                </div>
              </div>
              <Button onClick={calculateLaborCost} className="w-full">Calculate Labor Cost</Button>
              {laborResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Total Labor Hours:</span>
                    <span>{laborResult.totalHours} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost per Worker:</span>
                    <span>R {laborResult.costPerWorker}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total Labor Cost:</span>
                    <span className="text-primary">R {laborResult.totalCost}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unit Conversion Tools */}
          <Card>
            <CardHeader>
              <CardTitle>Unit Conversion Tools</CardTitle>
              <CardDescription>Convert between common engineering units</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input type="number" value={conversionValue} onChange={(e) => setConversionValue(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>From</Label>
                  <Select value={fromUnit} onValueChange={setFromUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meters">Meters</SelectItem>
                      <SelectItem value="feet">Feet</SelectItem>
                      <SelectItem value="inches">Inches</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                      <SelectItem value="pounds">Pounds</SelectItem>
                      <SelectItem value="celsius">Celsius</SelectItem>
                      <SelectItem value="fahrenheit">Fahrenheit</SelectItem>
                      <SelectItem value="liters">Liters</SelectItem>
                      <SelectItem value="gallons">Gallons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To</Label>
                  <Select value={toUnit} onValueChange={setToUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meters">Meters</SelectItem>
                      <SelectItem value="feet">Feet</SelectItem>
                      <SelectItem value="inches">Inches</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                      <SelectItem value="pounds">Pounds</SelectItem>
                      <SelectItem value="celsius">Celsius</SelectItem>
                      <SelectItem value="fahrenheit">Fahrenheit</SelectItem>
                      <SelectItem value="liters">Liters</SelectItem>
                      <SelectItem value="gallons">Gallons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={convertUnits} className="w-full">Convert</Button>
              {conversionResult && (
                <div className="p-4 bg-primary/5 rounded-lg">
                  <div className="flex justify-between text-lg font-bold">
                    <span>{conversionResult.original} {conversionResult.fromUnit} =</span>
                    <span className="text-primary">{conversionResult.result} {conversionResult.toUnit}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Timeline Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline Calculator</CardTitle>
              <CardDescription>Estimate project duration with parallel task execution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Total Tasks</Label>
                  <Input type="number" value={totalTasks} onChange={(e) => setTotalTasks(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Avg Duration per Task (days)</Label>
                  <Input type="number" value={avgTaskDuration} onChange={(e) => setAvgTaskDuration(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Parallel Tasks</Label>
                  <Input type="number" value={parallelTasks} onChange={(e) => setParallelTasks(e.target.value)} placeholder="1" />
                </div>
              </div>
              <Button onClick={calculateTimeline} className="w-full">Calculate Timeline</Button>
              {timelineResult && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Sequential Duration:</span>
                    <span>{timelineResult.sequentialDays} days</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Parallel Duration:</span>
                    <span className="text-primary">{timelineResult.parallelDays} days</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-semibold border-t pt-2">
                    <span>Time Saved:</span>
                    <span>{timelineResult.timeSaved} days ({timelineResult.efficiency}%)</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
