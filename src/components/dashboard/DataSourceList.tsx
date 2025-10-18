import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Trash2, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DataSource } from '@/types/dashboard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DataSourceListProps {
  onSelect?: (dataSource: DataSource) => void;
  refreshTrigger?: number;
}

export function DataSourceList({ onSelect, refreshTrigger }: DataSourceListProps) {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadDataSources = async () => {
    try {
      const { data, error } = await supabase
        .from('data_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDataSources((data || []) as DataSource[]);
    } catch (error) {
      console.error('Error loading data sources:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data sources',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataSources();
  }, [refreshTrigger]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('data_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Data source deleted',
        description: 'Data source has been removed successfully',
      });

      loadDataSources();
    } catch (error) {
      console.error('Error deleting data source:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete data source',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading data sources...</div>;
  }

  if (dataSources.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No data sources uploaded yet</p>
          <p className="text-sm mt-2">Upload an Excel file to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {dataSources.map((source) => (
        <Card key={source.id} className="hover:border-primary transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <CardTitle className="text-base">{source.name}</CardTitle>
                  <div className="text-sm text-muted-foreground mt-1">
                    <p>{source.file_name}</p>
                    <p className="mt-1">
                      {source.row_count} rows • {source.columns.length} columns
                    </p>
                    <p className="text-xs mt-1">
                      Columns: {source.columns.slice(0, 3).join(', ')}
                      {source.columns.length > 3 && ` +${source.columns.length - 3} more`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {onSelect && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelect(source)}
                  >
                    Use in Dashboard
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete data source?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the data source "{source.name}". This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(source.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
