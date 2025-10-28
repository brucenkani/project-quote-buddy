import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface DataTableFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    options: { label: string; value: string }[];
  }[];
  dateFilters?: {
    startDate: string;
    endDate: string;
    onStartDateChange: (value: string) => void;
    onEndDateChange: (value: string) => void;
  };
  onClearFilters: () => void;
}

export function DataTableFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  dateFilters,
  onClearFilters,
}: DataTableFiltersProps) {
  const hasActiveFilters = searchValue || filters.some(f => f.value !== 'all') || 
    (dateFilters && (dateFilters.startDate || dateFilters.endDate));

  return (
    <div className="space-y-4 mb-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="search" className="sr-only">Search</Label>
          <Input
            id="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {filters.map((filter, index) => (
          <div key={index} className="min-w-[150px]">
            <Select value={filter.value} onValueChange={filter.onValueChange}>
              <SelectTrigger>
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.label}</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        {dateFilters && (
          <>
            <div className="min-w-[150px]">
              <Label htmlFor="startDate" className="sr-only">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateFilters.startDate}
                onChange={(e) => dateFilters.onStartDateChange(e.target.value)}
              />
            </div>
            <div className="min-w-[150px]">
              <Label htmlFor="endDate" className="sr-only">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateFilters.endDate}
                onChange={(e) => dateFilters.onEndDateChange(e.target.value)}
              />
            </div>
          </>
        )}

        {hasActiveFilters && (
          <Button variant="ghost" onClick={onClearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
