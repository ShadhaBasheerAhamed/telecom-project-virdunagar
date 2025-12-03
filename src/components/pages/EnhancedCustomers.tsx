import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Loader2, Download, Filter, RefreshCw } from 'lucide-react';
import type { DataSource } from '../../types';
import { CustomerModal } from '../modals/CustomerModal';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';
import { ViewCustomerModal } from '../modals/ViewCustomerModal';
import { CustomerService } from '../../services/customerService';
import { exportService } from '../../services/enhancedExportService';
import { EnhancedStatusToggler } from '../../utils/enhancedStatusTogglers';
import { useNotificationActions } from '../../contexts/NotificationContext';
import type { Customer } from '../../types';
import type { SearchFilters, BulkOperationResult } from '../../types/enhanced';
import { toast } from 'sonner';

interface EnhancedCustomersProps {
  dataSource: DataSource;
  theme: 'light' | 'dark';
}

export function EnhancedCustomers({ dataSource, theme }: EnhancedCustomersProps) {
  const isDark = theme === 'dark';
  
  // State Management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPlan, setFilterPlan] = useState('All');
  const [filterSource, setFilterSource] = useState('All');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  
  // Modal States
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  
  // Advanced Filtering
  const [advancedFilters, setAdvancedFilters] = useState<SearchFilters>({
    query: '',
    fields: [],
    status: undefined,
    source: undefined,
    dateRange: undefined,
    customFilters: []
  });

  // Custom hooks
  const { notifyCustomerStatusChanged, notifySystemAlert } = useNotificationActions();

  // Load customers with real-time updates
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await CustomerService.getCustomers();
      setCustomers(data);
      
      // Store in localStorage for other components
      localStorage.setItem('customers-data', JSON.stringify(data));
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
      notifySystemAlert('Customer Load Error', 'Failed to load customer data', 'high');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = CustomerService.subscribeToCustomers((updatedCustomers) => {
      setCustomers(updatedCustomers);
      localStorage.setItem('customers-data', JSON.stringify(updatedCustomers));
    });

    return unsubscribe;
  }, []);

  // Advanced filtering logic
  useEffect(() => {
    let filtered = [...customers];

    // Text search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(customer => {
        const searchableFields = [
          customer.name,
          customer.id,
          customer.landline,
          customer.mobileNo,
          customer.altMobileNo,
          customer.email,
          customer.oltIp,
          customer.ottSubscription,
          customer.address
        ];

        if (searchField === 'All') {
          return searchableFields.some(field => 
            field?.toString().toLowerCase().includes(searchLower)
          );
        } else {
          const fieldMap: Record<string, keyof Customer> = {
            'Name': 'name',
            'ID': 'id',
            'Landline': 'landline',
            'Mobile': 'mobileNo',
            'Email': 'email',
            'OLT': 'oltIp'
          };
          const field = fieldMap[searchField];
          return field ? customer[field]?.toString().toLowerCase().includes(searchLower) : false;
        }
      });
    }

    // Status filter
    if (filterStatus !== 'All') {
      filtered = filtered.filter(customer => customer.status === filterStatus);
    }

    // Plan filter
    if (filterPlan !== 'All') {
      filtered = filtered.filter(customer => customer.plan === filterPlan);
    }

    // Source filter
    if (filterSource !== 'All') {
      filtered = filtered.filter(customer => customer.source === filterSource);
    }

    // Advanced filters
    if (advancedFilters.status) {
      filtered = filtered.filter(customer => customer.status === advancedFilters.status);
    }
    
    if (advancedFilters.source) {
      filtered = filtered.filter(customer => customer.source === advancedFilters.source);
    }

    if (advancedFilters.dateRange) {
      filtered = filtered.filter(customer => {
        const createdAt = customer.createdAt ? new Date(customer.createdAt) : null;
        if (!createdAt) return false;
        const startDate = new Date(advancedFilters.dateRange!.startDate);
        const endDate = new Date(advancedFilters.dateRange!.endDate);
        return createdAt >= startDate && createdAt <= endDate;
      });
    }

    // Custom filters
    if (advancedFilters.customFilters && advancedFilters.customFilters.length > 0) {
      filtered = filtered.filter(customer => {
        return advancedFilters.customFilters!.every(filter => {
          const value = (customer as any)[filter.field];
          switch (filter.operator) {
            case 'equals':
              return filter.caseSensitive ? value === filter.value : 
                     value?.toString().toLowerCase() === filter.value.toString().toLowerCase();
            case 'contains':
              return filter.caseSensitive ? 
                     value?.toString().includes(filter.value) :
                     value?.toString().toLowerCase().includes(filter.value.toLowerCase());
            case 'startsWith':
              return filter.caseSensitive ?
                     value?.toString().startsWith(filter.value) :
                     value?.toString().toLowerCase().startsWith(filter.value.toLowerCase());
            case 'endsWith':
              return filter.caseSensitive ?
                     value?.toString().endsWith(filter.value) :
                     value?.toString().toLowerCase().endsWith(filter.value.toLowerCase());
            case 'greaterThan':
              return Number(value) > Number(filter.value);
            case 'lessThan':
              return Number(value) < Number(filter.value);
            case 'in':
              return Array.isArray(filter.value) ? filter.value.includes(value) : false;
            case 'notIn':
              return Array.isArray(filter.value) ? !filter.value.includes(value) : true;
            default:
              return true;
          }
        });
      });
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, searchField, filterStatus, filterPlan, filterSource, advancedFilters]);

  // Get unique values for filters
  const getFilterOptions = () => {
    const plans = [...new Set(customers.map(c => c.plan).filter(Boolean))];
    const sources = [...new Set(customers.map(c => c.source))];
    const statuses = [...new Set(customers.map(c => c.status))];
    
    return { plans, sources, statuses };
  };

  // Status toggle handler
  const handleStatusToggle = async (customerId: string, currentStatus: string) => {
    if (updatingStatus === customerId) return;
    
    setUpdatingStatus(customerId);
    try {
      const oldStatus = currentStatus;
      const result = await EnhancedStatusToggler.toggleCustomerStatus(customerId, currentStatus, {
        confirmMessage: `Change customer status from "${currentStatus}"?`,
        showNotification: true,
        updateRelatedRecords: true
      });

      if (result.success) {
        // Update local state immediately
        setCustomers(prev => prev.map(customer => 
          customer.id === customerId 
            ? { ...customer, status: result.data!.newStatus }
            : customer
        ));
        
        notifyCustomerStatusChanged(customerId, oldStatus, result.data!.newStatus);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Failed to update customer status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Customer CRUD operations
  const handleAddCustomer = async (customerData: any) => {
    try {
      const random = Math.floor(100000 + Math.random() * 900000);
      const newId = `104562-${random}-CUSTOMER-RECORD`;
      
      await CustomerService.addCustomer({ ...customerData, id: newId });
      toast.success('Customer added successfully!');
      setModalMode(null);
      
      // Refresh will happen automatically via subscription
    } catch (error) {
      console.error('Add customer error:', error);
      toast.error('Failed to add customer');
    }
  };

  const handleEditCustomer = async (customer: Customer) => {
    try {
      const { id, ...updates } = customer;
      await CustomerService.updateCustomer(id, updates);
      
      toast.success('Customer updated successfully!');
      setModalMode(null);
      setSelectedCustomer(null);
      
      // Refresh will happen automatically via subscription
    } catch (error) {
      console.error('Edit customer error:', error);
      toast.error('Failed to update customer');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    
    try {
      await CustomerService.deleteCustomer(selectedCustomer.id);
      toast.success('Customer deleted successfully');
      setDeleteModalOpen(false);
      setSelectedCustomer(null);
      
      // Refresh will happen automatically via subscription
    } catch (error) {
      console.error('Delete customer error:', error);
      toast.error('Failed to delete customer');
    }
  };

  // Export functionality
  const handleExport = async (format: 'csv' | 'pdf', type: 'filtered' | 'all' = 'filtered') => {
    setIsExporting(true);
    try {
      const dataToExport = type === 'all' ? customers : filteredCustomers;
      const filename = `customers-${type}-${new Date().toISOString().split('T')[0]}`;
      
      await exportService.exportFormattedData(
        dataToExport,
        filename,
        format,
        {
          dateFields: ['createdAt', 'installationDate', 'renewalDate'],
          currencyFields: ['monthlyFee'],
          booleanFields: ['isActive', 'isRenewed'],
          title: `${type === 'all' ? 'All' : 'Filtered'} Customers Export`
        }
      );
      
      toast.success(`Customers exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export customers');
    } finally {
      setIsExporting(false);
    }
  };

  // Bulk operations
  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedCustomers.length === 0) {
      toast.error('Please select customers to update');
      return;
    }

    try {
      const statusChanges = selectedCustomers.map(id => {
        const customer = customers.find(c => c.id === id);
        return {
          id,
          currentStatus: customer?.status || 'Active',
          newStatus
        };
      });

      const result = await EnhancedStatusToggler.bulkToggleStatus(
        'customer',
        selectedCustomers,
        statusChanges,
        {
          confirmMessage: `Update status of ${selectedCustomers.length} customers to "${newStatus}"?`,
          showNotification: true
        }
      );

      if (result.success > 0) {
        setSelectedCustomers([]);
        toast.success(`Successfully updated ${result.success} customers`);
      }
      
      if (result.failed > 0) {
        toast.error(`Failed to update ${result.failed} customers`);
      }
    } catch (error) {
      console.error('Bulk status update error:', error);
      toast.error('Failed to update customer statuses');
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('All');
    setFilterPlan('All');
    setFilterSource('All');
    setAdvancedFilters({
      query: '',
      fields: [],
      status: undefined,
      source: undefined,
      dateRange: undefined,
      customFilters: []
    });
  };

  const { plans, sources, statuses } = getFilterOptions();

  return (
    <div className={`w-full p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Enhanced Header Section */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Customer Management
            </h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              {filteredCustomers.length} of {customers.length} customers
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRefreshing(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Export:</span>
              <button
                onClick={() => handleExport('csv', 'filtered')}
                disabled={isExporting}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-all disabled:opacity-50"
              >
                CSV
              </button>
              <button
                onClick={() => handleExport('pdf', 'filtered')}
                disabled={isExporting}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-all disabled:opacity-50"
              >
                PDF
              </button>
            </div>
            
            <button
              onClick={() => setModalMode('add')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-md shadow-lg transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </button>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className={`p-4 rounded-lg border ${isDark ? 'bg-[#242a38] border-gray-700' : 'bg-white border-gray-200'}`}>
          
          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-2.5 h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                className={`block w-full pl-10 pr-3 py-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}
                placeholder={`Search in ${searchField}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className={`px-4 py-2.5 rounded-md border outline-none text-sm font-medium ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}
            >
              <option value="All">All Fields</option>
              <option value="Name">Name</option>
              <option value="ID">ID</option>
              <option value="Landline">Landline</option>
              <option value="Mobile">Mobile</option>
              <option value="Email">Email</option>
              <option value="OLT">OLT IP</option>
            </select>
            
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-all"
            >
              <Filter className="h-4 w-4" />
              Clear
            </button>
          </div>
          
          {/* Filter Dropdowns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-3 py-2 rounded-md border outline-none text-sm ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}
            >
              <option value="All">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className={`px-3 py-2 rounded-md border outline-none text-sm ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}
            >
              <option value="All">All Plans</option>
              {plans.map(plan => (
                <option key={plan} value={plan}>{plan}</option>
              ))}
            </select>
            
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className={`px-3 py-2 rounded-md border outline-none text-sm ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}
            >
              <option value="All">All Sources</option>
              {sources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
            
            <select
              value={dataSource}
              onChange={() => {}} // Data source is controlled by parent
              className={`px-3 py-2 rounded-md border outline-none text-sm ${isDark ? 'bg-[#1a1f2c] border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}
            >
              <option value="All">All Data Sources</option>
              <option value="BSNL">BSNL</option>
              <option value="RMAX">RMAX</option>
            </select>
          </div>
          
          {/* Bulk Operations */}
          {selectedCustomers.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {selectedCustomers.length} customer(s) selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkStatusUpdate('Active')}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-all"
                  >
                    Set Active
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('Inactive')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-all"
                  >
                    Set Inactive
                  </button>
                  <button
                    onClick={() => setSelectedCustomers([])}
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-all"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Table */}
      <div className={`w-full rounded-lg border shadow-xl ${isDark ? 'border-gray-700 bg-[#242a38]' : 'border-gray-200 bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className={`${isDark ? 'bg-[#1f2533] text-gray-400' : 'bg-gray-50 text-gray-500'} font-semibold uppercase tracking-wider`}>
              <tr>
                <th className="px-6 py-4 min-w-[50px]">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCustomers(filteredCustomers.map(c => c.id));
                      } else {
                        setSelectedCustomers([]);
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-4 min-w-[180px]">ID</th>
                <th className="px-6 py-4 min-w-[140px]">Landline</th>
                <th className="px-6 py-4 min-w-[250px]">Name</th>
                <th className="px-6 py-4 min-w-[140px]">Mobile</th>
                <th className="px-6 py-4 min-w-[180px]">Plan</th>
                <th className="px-6 py-4 min-w-[140px]">OLT IP</th>
                <th className="px-6 py-4 min-w-[120px]">OTT</th>
                <th className="px-6 py-4 min-w-[140px]">Install Date</th>
                <th className={`px-6 py-4 min-w-[120px] sticky right-[110px] ${isDark ? 'bg-[#1f2533]' : 'bg-gray-50'} z-20 shadow-[-5px_0px_10px_rgba(0,0,0,0.2)]`}>Status</th>
                <th className={`px-6 py-4 min-w-[110px] text-center sticky right-0 ${isDark ? 'bg-[#1f2533]' : 'bg-gray-50'} z-20`}>Options</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading customers from database...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center">
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {customers.length === 0 ? 'No customers found. Add a new customer to get started.' : 'No customers match your current filters.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className={`hover:${isDark ? 'bg-[#2d3546]' : 'bg-gray-50'} transition-colors`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCustomers(prev => [...prev, customer.id]);
                          } else {
                            setSelectedCustomers(prev => prev.filter(id => id !== customer.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{customer.id}</td>
                    <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{customer.landline}</td>
                    <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{customer.name}</td>
                    <td className="px-6 py-4">{customer.mobileNo}</td>
                    <td className={`px-6 py-4 font-medium ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{customer.plan}</td>
                    <td className="px-6 py-4 font-mono text-xs">{customer.oltIp}</td>
                    <td className={`px-6 py-4 text-xs font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{customer.ottSubscription || '-'}</td>
                    <td className="px-6 py-4">{customer.installationDate}</td>

                    {/* Enhanced Status Column */}
                    <td className={`px-6 py-4 sticky right-[110px] ${isDark ? 'bg-[#242a38]' : 'bg-white'} z-10 shadow-[-5px_0px_10px_rgba(0,0,0,0.2)]`}>
                      <button
                        onClick={() => handleStatusToggle(customer.id, customer.status)}
                        disabled={updatingStatus === customer.id}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-md ${
                          customer.status === 'Active'
                            ? 'bg-green-900/30 text-green-400 border-green-800 hover:bg-green-800/50'
                            : customer.status === 'Inactive'
                            ? 'bg-red-900/30 text-red-400 border-red-800 hover:bg-red-800/50'
                            : customer.status === 'Suspended'
                            ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800 hover:bg-yellow-800/50'
                            : 'bg-gray-900/30 text-gray-400 border-gray-800 hover:bg-gray-800/50'
                        } ${updatingStatus === customer.id ? 'cursor-wait' : 'cursor-pointer'}`}
                        title={`Click to change status to ${customer.status === 'Active' ? 'Inactive' : 'Active'}`}
                      >
                        {updatingStatus === customer.id ? (
                          <div className="flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Updating...</span>
                          </div>
                        ) : (
                          customer.status
                        )}
                      </button>
                    </td>

                    {/* Options Column */}
                    <td className={`px-6 py-4 text-center sticky right-0 ${isDark ? 'bg-[#242a38]' : 'bg-white'} z-10`}>
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => { setSelectedCustomer(customer); setViewModalOpen(true); }} 
                          className="text-blue-400 hover:text-blue-300 p-1 transition-colors" 
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => { setSelectedCustomer(customer); setModalMode('edit'); }} 
                          className="text-yellow-400 hover:text-yellow-300 p-1 transition-colors" 
                          title="Edit Customer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => { setSelectedCustomer(customer); setDeleteModalOpen(true); }} 
                          className="text-red-400 hover:text-red-300 p-1 transition-colors" 
                          title="Delete Customer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Modals */}
      {modalMode && (
        <CustomerModal 
          mode={modalMode} 
          customer={selectedCustomer} 
          theme={theme} 
          defaultSource={dataSource} 
          onClose={() => setModalMode(null)} 
          onSave={modalMode === 'add' ? handleAddCustomer : handleEditCustomer} 
        />
      )}
      
      {viewModalOpen && selectedCustomer && (
        <ViewCustomerModal 
          customer={selectedCustomer} 
          theme={theme} 
          onClose={() => setViewModalOpen(false)} 
        />
      )}
      
      {deleteModalOpen && (
        <DeleteConfirmModal 
          title="Delete Customer" 
          message={`Delete ${selectedCustomer?.name}? This action cannot be undone.`} 
          theme={theme} 
          onConfirm={handleDeleteCustomer} 
          onCancel={() => setDeleteModalOpen(false)} 
        />
      )}
    </div>
  );
}