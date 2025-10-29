import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useInventory } from '@/contexts/InventoryContext';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface WarehouseTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WarehouseTransferDialog({ open, onOpenChange }: WarehouseTransferDialogProps) {
  const { toast } = useToast();
  const { warehouses } = useWarehouse();
  const { inventory, refreshInventory } = useInventory();
  const { activeCompany } = useCompany();
  const [transferMode, setTransferMode] = useState<'single' | 'bulk'>('single');
  const [serialOrSku, setSerialOrSku] = useState('');
  const [sourceWarehouse, setSourceWarehouse] = useState('');
  const [destinationWarehouse, setDestinationWarehouse] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkResults, setBulkResults] = useState<any>(null);

  // Auto-populate source warehouse when serial/SKU is entered
  useEffect(() => {
    const checkSerialOrSku = async () => {
      if (!serialOrSku || !activeCompany) {
        setSourceWarehouse('');
        setValidationError('');
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('check_serial_number_exists', {
            p_serial_number: serialOrSku,
            p_company_id: activeCompany.id
          });

        if (error) throw error;

        if (data && data.length > 0) {
          setSourceWarehouse(data[0].warehouse_id || '');
          setValidationError('');
        } else {
          // Check by SKU
          const item = inventory.find(i => i.sku === serialOrSku);
          if (item && item.warehouse_id) {
            setSourceWarehouse(item.warehouse_id);
            setValidationError('');
          } else {
            setSourceWarehouse('');
            setValidationError('Serial number or SKU not found in inventory. Please check and try again or add the item first.');
          }
        }
      } catch (error) {
        console.error('Error checking serial/SKU:', error);
        setValidationError('Error validating serial number or SKU');
      }
    };

    const debounce = setTimeout(checkSerialOrSku, 500);
    return () => clearTimeout(debounce);
  }, [serialOrSku, activeCompany, inventory]);

  const handleSingleTransfer = async () => {
    if (!serialOrSku || !sourceWarehouse || !destinationWarehouse) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    if (validationError) {
      toast({ title: validationError, variant: 'destructive' });
      return;
    }

    if (sourceWarehouse === destinationWarehouse) {
      toast({ title: 'Source and destination warehouses must be different', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeCompany) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('transfer_serial_numbers', {
        p_serial_numbers: [serialOrSku],
        p_source_warehouse_id: sourceWarehouse,
        p_destination_warehouse_id: destinationWarehouse,
        p_company_id: activeCompany.id,
        p_user_id: user.id
      });

      if (error) throw error;

      const result = data as { success: any[], errors: any[] };

      if (result.errors && result.errors.length > 0) {
        toast({ 
          title: 'Transfer failed', 
          description: result.errors[0].error,
          variant: 'destructive' 
        });
      } else {
        toast({ title: 'Transfer completed successfully' });
        await refreshInventory();
        resetForm();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Transfer error:', error);
      toast({ title: 'Failed to complete transfer', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkTransfer = async () => {
    if (!bulkFile) {
      toast({ title: 'Please upload an Excel file', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setBulkResults(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeCompany) throw new Error('User not authenticated');

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

          if (!jsonData.length) {
            toast({ title: 'Excel file is empty', variant: 'destructive' });
            setLoading(false);
            return;
          }

          // Validate columns
          const requiredColumns = ['serial_number', 'destination_warehouse'];
          const firstRow = jsonData[0];
          const hasRequiredColumns = requiredColumns.every(col => 
            Object.keys(firstRow).some(key => key.toLowerCase() === col.toLowerCase())
          );

          if (!hasRequiredColumns) {
            toast({ 
              title: 'Invalid Excel format', 
              description: 'Excel file must have columns: serial_number, destination_warehouse',
              variant: 'destructive' 
            });
            setLoading(false);
            return;
          }

          // Group by source and destination warehouse
          const transferGroups: Record<string, { serial_numbers: string[], destination_warehouse_id: string }> = {};

          for (const row of jsonData) {
            const serialNumber = row.serial_number || row.Serial_Number || row['Serial Number'];
            const destWarehouseName = row.destination_warehouse || row.Destination_Warehouse || row['Destination Warehouse'];

            if (!serialNumber || !destWarehouseName) continue;

            // Find destination warehouse
            const destWarehouse = warehouses.find(w => 
              w.name.toLowerCase() === destWarehouseName.toLowerCase()
            );

            if (!destWarehouse) {
              toast({ 
                title: 'Warehouse not found', 
                description: `Warehouse "${destWarehouseName}" not found. Please create it first.`,
                variant: 'destructive' 
              });
              setLoading(false);
              return;
            }

            // Check source warehouse for this serial
            const { data: checkData } = await supabase.rpc('check_serial_number_exists', {
              p_serial_number: serialNumber,
              p_company_id: activeCompany.id
            });

            if (!checkData || checkData.length === 0) {
              toast({ 
                title: 'Serial number not found', 
                description: `Serial number "${serialNumber}" not found in inventory`,
                variant: 'destructive' 
              });
              setLoading(false);
              return;
            }

            const sourceWarehouseId = checkData[0].warehouse_id;
            const key = `${sourceWarehouseId}_${destWarehouse.id}`;

            if (!transferGroups[key]) {
              transferGroups[key] = {
                serial_numbers: [],
                destination_warehouse_id: destWarehouse.id
              };
            }

            transferGroups[key].serial_numbers.push(serialNumber);
          }

          // Execute transfers
          const allResults = { success: [], errors: [] };

          for (const [key, group] of Object.entries(transferGroups)) {
            const sourceWarehouseId = key.split('_')[0];
            
            const { data: transferData, error: transferError } = await supabase.rpc('transfer_serial_numbers', {
              p_serial_numbers: group.serial_numbers,
              p_source_warehouse_id: sourceWarehouseId,
              p_destination_warehouse_id: group.destination_warehouse_id,
              p_company_id: activeCompany.id,
              p_user_id: user.id
            });

            if (transferError) throw transferError;

            const result = transferData as { success: any[], errors: any[] };
            allResults.success.push(...(result.success || []));
            allResults.errors.push(...(result.errors || []));
          }

          setBulkResults(allResults);
          await refreshInventory();

          if (allResults.errors.length === 0) {
            toast({ title: `Successfully transferred ${allResults.success.length} items` });
          } else {
            toast({ 
              title: 'Bulk transfer completed with errors', 
              description: `${allResults.success.length} succeeded, ${allResults.errors.length} failed`,
              variant: 'destructive'
            });
          }
        } catch (error) {
          console.error('Bulk transfer error:', error);
          toast({ title: 'Failed to process bulk transfer', variant: 'destructive' });
        } finally {
          setLoading(false);
        }
      };

      reader.readAsArrayBuffer(bulkFile);
    } catch (error) {
      console.error('Bulk transfer error:', error);
      toast({ title: 'Failed to process bulk transfer', variant: 'destructive' });
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSerialOrSku('');
    setSourceWarehouse('');
    setDestinationWarehouse('');
    setNotes('');
    setValidationError('');
    setBulkFile(null);
    setBulkResults(null);
  };

  const downloadTemplate = () => {
    const template = [
      { serial_number: 'SN123456', destination_warehouse: 'Main Warehouse' },
      { serial_number: 'SN123457', destination_warehouse: 'Branch Warehouse' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'warehouse_transfer_template.xlsx');
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) resetForm(); }}>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Warehouse Transfer</DialogTitle>
        </DialogHeader>
        
        <Tabs value={transferMode} onValueChange={(v) => setTransferMode(v as 'single' | 'bulk')} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Transfer</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Transfer</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pr-2">
            <TabsContent value="single" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="serial-sku">Serial Number or SKU *</Label>
                <Input
                  id="serial-sku"
                  value={serialOrSku}
                  onChange={(e) => setSerialOrSku(e.target.value)}
                  placeholder="Enter serial number or SKU"
                />
                {validationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">From Warehouse</Label>
                <Input
                  id="source"
                  value={warehouses.find(w => w.id === sourceWarehouse)?.name || 'Auto-detecting...'}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Source warehouse is automatically detected from the serial number or SKU</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">To Warehouse *</Label>
                <Select value={destinationWarehouse} onValueChange={setDestinationWarehouse}>
                  <SelectTrigger id="destination">
                    <SelectValue placeholder="Select destination warehouse" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {warehouses.filter(w => w.is_active && w.id !== sourceWarehouse).map(warehouse => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional transfer notes"
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4 mt-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Upload an Excel file with columns: <strong>serial_number</strong>, <strong>destination_warehouse</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="template">Download Template</Label>
                <Button variant="outline" onClick={downloadTemplate} className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Download Excel Template
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-file">Upload Excel File *</Label>
                <Input
                  id="bulk-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                />
              </div>

              {bulkResults && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {bulkResults.success.length > 0 && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Successfully transferred {bulkResults.success.length} items:</strong>
                        <ul className="list-disc list-inside mt-2 text-xs">
                          {bulkResults.success.slice(0, 5).map((item: any, i: number) => (
                            <li key={i}>{item.serial_number} - {item.sku}</li>
                          ))}
                          {bulkResults.success.length > 5 && <li>...and {bulkResults.success.length - 5} more</li>}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {bulkResults.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Failed to transfer {bulkResults.errors.length} items:</strong>
                        <ul className="list-disc list-inside mt-2 text-xs">
                          {bulkResults.errors.map((item: any, i: number) => (
                            <li key={i}>{item.serial_number}: {item.error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>Cancel</Button>
          <Button 
            onClick={transferMode === 'single' ? handleSingleTransfer : handleBulkTransfer}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Transfer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
