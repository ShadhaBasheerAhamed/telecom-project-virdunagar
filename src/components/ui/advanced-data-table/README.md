# Advanced Data Table Component

A comprehensive, reusable data table component with advanced filtering, sticky columns, and modern UI design.

## Features

### ✅ All Required Columns
- **Id**: Customer identifier
- **Landline**: Phone number
- **Name**: Customer name
- **Mobile No**: Primary mobile number
- **Alternative Mobile No**: Secondary contact
- **Vlan Id**: VLAN identifier
- **BB Id**: Broadband identifier
- **Voip Password**: VoIP credentials
- **ONT Make**: ONT manufacturer
- **ONT Type**: ONT model type
- **ONT Mac Address**: Physical MAC address
- **ONT Bill No**: Billing number
- **ONT**: ONT type/status
- **Offer Prize**: Offer amount
- **Router Make**: Router manufacturer
- **Router Mac Id**: Router MAC address
- **OLT IP**: OLT server IP
- **Installation Date**: Setup date
- **Status**: Customer status (Active/Inactive)
- **Options**: Action buttons

### ✅ Horizontal Scrolling with Sticky Columns
- **Dynamic Horizontal Scroll**: Table supports horizontal scrolling for many columns
- **Fixed Status Column**: Sticky right position at 100px offset
- **Fixed Options Column**: Sticky right position at 0px offset
- **Visual Indicators**: Drop shadows indicate scrollable content

### ✅ Advanced Search & Filtering
- **Field-Specific Search**: Dropdown to select search field (All, Name, ID, Mobile, etc.)
- **Smart Search Bar**: Real-time filtering with debounced search
- **Multiple Filters**: Status, OLT IP, Source dropdown filters
- **Active Filter Display**: Visual badges showing current filters
- **Clear Filters**: One-click to reset all filters

### ✅ Status Badges
- **Color-Coded Status**: Green for 'Active', Red for 'Inactive'
- **Visual Dots**: Colored indicators for quick recognition
- **Shadow Effects**: Subtle shadows for depth

### ✅ Action Options
- **View Button**: Eye icon for viewing details
- **Edit Button**: Edit icon for modifications
- **Delete Button**: Trash icon for removal
- **Custom Actions**: Support for additional action types

### ✅ Modern & Responsive Design
- **Dark/Light Theme**: Automatic theme switching
- **Responsive Layout**: Adapts to different screen sizes
- **Modern Styling**: Clean, professional appearance
- **Loading States**: Animated loading indicators
- **Empty States**: User-friendly no-data messages

## Usage

### Basic Usage

```tsx
import { AdvancedDataTable } from '@/components/ui/advanced-data-table';
import type { CustomerData } from '@/types/table';

const customerData: CustomerData[] = [...]; // Your data

function MyComponent() {
  return (
    <AdvancedDataTable
      data={customerData}
      theme="light"
      onAdd={() => console.log('Add customer')}
      onExport={() => console.log('Export data')}
    />
  );
}
```

### Advanced Usage

```tsx
import { Eye, Edit, Trash2 } from 'lucide-react';
import type { CustomerData, ActionButton, FilterOption } from '@/types/table';

// Custom action buttons
const customActions: ActionButton[] = [
  {
    icon: <Eye className="w-4 h-4" />,
    label: 'View Details',
    variant: 'view',
    onClick: (row) => console.log('View:', row.id),
  },
  {
    icon: <Edit className="w-4 h-4" />,
    label: 'Edit',
    variant: 'edit',
    onClick: (row) => console.log('Edit:', row.id),
  },
  {
    icon: <Trash2 className="w-4 h-4" />,
    label: 'Delete',
    variant: 'delete',
    onClick: (row) => console.log('Delete:', row.id),
  },
];

// Custom filter options
const customFilters: Record<string, FilterOption[]> = {
  status: [
    { label: 'All Status', value: 'All' },
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
    { label: 'Suspended', value: 'Suspended' }
  ],
  plan: [
    { label: 'All Plans', value: 'All' },
    { label: 'Basic', value: 'Basic' },
    { label: 'Premium', value: 'Premium' },
    { label: 'Enterprise', value: 'Enterprise' }
  ]
};

function AdvancedComponent() {
  return (
    <AdvancedDataTable
      data={customerData}
      title="Customer Management"
      theme="dark"
      actionButtons={customActions}
      filterOptions={customFilters}
      loading={isLoading}
      onAdd={() => openAddModal()}
      onExport={() => exportToCSV()}
    />
  );
}
```

## Component Props

### AdvancedTableProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | `CustomerData[]` | ✅ | Array of data objects to display |
| `columns` | `TableColumn[]` | ❌ | Column configuration (uses defaults) |
| `searchFields` | `SearchField[]` | ❌ | Available search fields (uses defaults) |
| `filterOptions` | `Record<string, FilterOption[]>` | ❌ | Filter dropdown options |
| `actionButtons` | `ActionButton[]` | ❌ | Action button configuration |
| `title` | `string` | ❌ | Table title |
| `theme` | `'light' \| 'dark'` | ❌ | Theme mode |
| `loading` | `boolean` | ❌ | Loading state |
| `onAdd` | `() => void` | ❌ | Add button callback |
| `onExport` | `() => void` | ❌ | Export button callback |
| `className` | `string` | ❌ | Additional CSS classes |

## Data Structure

### CustomerData Interface

```typescript
interface CustomerData {
  id: string;
  landline: string;
  name: string;
  mobileNo: string;
  altMobileNo: string;
  vlanId: string;
  bbId: string;
  voipPassword: string;
  ontMake: string;
  ontType: string;
  ontMacAddress: string;
  ontBillNo: string;
  ont: string;
  offerPrize: string;
  routerMake: string;
  routerMacId: string;
  oltIp: string;
  installationDate: string;
  status: 'Active' | 'Inactive';
  source?: string;
  email?: string;
  plan?: string;
}
```

## Key Features Implementation

### 1. Sticky Columns
```css
/* Status column fixed at right-100px */
.status-column {
  position: sticky;
  right: 100px;
  z-index: 20;
}

/* Options column fixed at right-0 */
.options-column {
  position: sticky;
  right: 0;
  z-index: 20;
}
```

### 2. Status Badges
```tsx
function StatusBadge({ status }: { status: 'Active' | 'Inactive' }) {
  const config = {
    Active: { className: 'bg-green-500 text-white', dotClass: 'bg-green-400' },
    Inactive: { className: 'bg-red-500 text-white', dotClass: 'bg-red-400' }
  };
  
  return (
    <Badge className={config[status].className}>
      <span className={`w-2 h-2 rounded-full mr-2 ${config[status].dotClass}`} />
      {status}
    </Badge>
  );
}
```

### 3. Advanced Filtering
```tsx
const filteredData = useMemo(() => {
  return data.filter((row) => {
    // Search filter logic
    let matchesSearch = true;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      matchesSearch = columns
        .filter(col => col.searchable)
        .some(col => String(row[col.key]).toLowerCase().includes(searchLower));
    }

    // Additional filters
    const matchesFilters = Object.entries(filters).every(([key, value]) => {
      if (value === 'All' || !value) return true;
      return String(row[key as keyof CustomerData]) === value;
    });

    return matchesSearch && matchesFilters;
  });
}, [data, searchTerm, searchField, filters, columns]);
```

## Demo Page

Visit `/datatable-demo` to see the component in action with:
- Interactive demo controls
- Feature highlights
- Live examples
- Theme switching
- Data refresh simulation

## Dependencies

- React 18+
- Lucide React (icons)
- Tailwind CSS (styling)
- Radix UI (Select, DropdownMenu)
- TypeScript (type safety)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

- **Memoized Filtering**: Uses `useMemo` for expensive filter operations
- **Debounced Search**: Search input is debounced to prevent excessive re-renders
- **Virtual Scrolling**: Consider for datasets > 1000 rows
- **Lazy Loading**: Implement for large datasets