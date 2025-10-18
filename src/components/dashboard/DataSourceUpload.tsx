import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface DataSourceUploadProps {
  onUploadComplete?: () => void;
}

export function DataSourceUpload({ onUploadComplete }: DataSourceUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an Excel file (.xlsx or .xls)',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length === 0) {
            throw new Error('Excel file is empty');
          }

          const columns = jsonData[0] as string[];
          const rows = jsonData.slice(1);

          // Get current user
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');

          // Get user's company
          const { data: memberData } = await supabase
            .from('company_members')
            .select('company_id')
            .eq('user_id', user.id)
            .single();

          // Insert data source
          const { error } = await supabase
            .from('data_sources')
            .insert({
              user_id: user.id,
              company_id: memberData?.company_id || null,
              name: file.name.replace(/\.[^/.]+$/, ''),
              file_name: file.name,
              columns: columns as any,
              data: rows as any,
              row_count: rows.length,
            });

          if (error) throw error;

          toast({
            title: 'Data source uploaded',
            description: `Successfully uploaded ${rows.length} rows with ${columns.length} columns`,
          });

          onUploadComplete?.();
          event.target.value = '';
        } catch (error) {
          console.error('Error processing file:', error);
          toast({
            title: 'Upload failed',
            description: error instanceof Error ? error.message : 'Failed to process Excel file',
            variant: 'destructive',
          });
        } finally {
          setUploading(false);
        }
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to read Excel file',
        variant: 'destructive',
      });
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Upload Data Source
        </CardTitle>
        <CardDescription>
          Upload an Excel file (.xlsx or .xls) with headers in the first row
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="excel-upload">Excel File</Label>
            <div className="flex gap-2">
              <Input
                id="excel-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {uploading && <Loader2 className="h-5 w-5 animate-spin" />}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>• First row should contain column headers</p>
            <p>• Data will be analyzed to help create reports and dashboards</p>
            <p>• Supported formats: .xlsx, .xls</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
