# Table Filtering & Sorting Pattern

This document describes the filtering and sorting pattern implemented across all data tables in the application.

## ✅ Completed Implementation

### Invoices Page (`src/pages/Invoices.tsx`)
- **Filters:**
  - Search by invoice number, customer name, project name
  - Filter by customer (dropdown)
  - Filter by date range (start date - end date)
  - Clear all filters button

- **Sortable Columns:**
  - Customer Name
  - Doc. No. (Invoice Number)
  - Date (Issue Date)
  - Due Date
  - Total
  - Amount Due
  - Status

## Components Created

### 1. DataTableFilters (`src/components/ui/data-table-filters.tsx`)
Reusable filter component with:
- Search input
- Multiple dropdown filters
- Date range filters
- Clear filters button
- Shows only when filters are active

### 2. SortableTableHeader (`src/components/ui/sortable-table-header.tsx`)
Sortable table header with:
- Click to sort
- Visual indicators (arrows) for sort direction
- Active/inactive states

## Implementation Pattern

### Step 1: Add Filter & Sort State
```tsx
const [searchQuery, setSearchQuery] = useState('');
const [filterValue, setFilterValue] = useState('all');
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');
const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
  key: 'date',
  direction: 'desc',
});
```

### Step 2: Add Unique Values for Filters
```tsx
const uniqueValues = useMemo(() => {
  const values = new Set(data.map(item => item.fieldName));
  return Array.from(values).sort();
}, [data]);
```

### Step 3: Handle Sort
```tsx
const handleSort = (key: string) => {
  setSortConfig({
    key,
    direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
  });
};
```

### Step 4: Filter & Sort Data
```tsx
const displayData = useMemo(() => {
  let filtered = data.filter(item => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = /* check multiple fields */;
      if (!matchesSearch) return false;
    }

    // Dropdown filter
    if (filterValue !== 'all' && item.field !== filterValue) {
      return false;
    }

    // Date range filter
    if (startDate && new Date(item.date) < new Date(startDate)) {
      return false;
    }
    if (endDate && new Date(item.date) > new Date(endDate)) {
      return false;
    }

    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortConfig.key) {
      case 'field1':
        aValue = a.field1;
        bValue = b.field1;
        break;
      // ... other cases
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return filtered;
}, [data, searchQuery, filterValue, startDate, endDate, sortConfig]);
```

### Step 5: Add Filter UI
```tsx
<DataTableFilters
  searchValue={searchQuery}
  onSearchChange={setSearchQuery}
  searchPlaceholder="Search..."
  filters={[
    {
      label: 'Field',
      value: filterValue,
      onValueChange: setFilterValue,
      options: uniqueValues.map(v => ({ label: v, value: v })),
    },
  ]}
  dateFilters={{
    startDate,
    endDate,
    onStartDateChange: setStartDate,
    onEndDateChange: setEndDate,
  }}
  onClearFilters={() => {
    setSearchQuery('');
    setFilterValue('all');
    setStartDate('');
    setEndDate('');
  }}
/>
```

### Step 6: Update Table Headers
```tsx
<SortableTableHeader
  sortKey="fieldName"
  currentSort={sortConfig}
  onSort={handleSort}
  className="text-right" // optional
>
  Column Name
</SortableTableHeader>
```

## Tables to Update

### High Priority (Financial)
- ✅ **Invoices** - COMPLETED
- [ ] **Expenses** - Needs implementation
- [ ] **Purchases** - Needs implementation
- [ ] **Purchase Orders** - Needs implementation

### Medium Priority (HR & CRM)
- [ ] **Employees**
- [ ] **Payroll**
- [ ] **Customer Database**
- [ ] **Tickets**

### Lower Priority
- [ ] **Bank Transactions**
- [ ] **Journal Entries**
- [ ] **Recurring Invoices**
- [ ] **Leave Management**

## Notes
- All tables should follow the same pattern for consistency
- Date filters should use ISO format (YYYY-MM-DD)
- Sort should maintain data type awareness (strings, numbers, dates)
- Filters should be cleared when switching tabs/views
