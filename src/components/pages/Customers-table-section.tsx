import { Eye, Edit, Trash2 } from 'lucide-react';
import type { Customer } from '../../types';

interface CustomerTableSectionProps {
  customers: Customer[];
  filteredCustomers: Customer[];
  isDark: boolean;
  setSelectedCustomer: (customer: Customer) => void;
  setViewModalOpen: (open: boolean) => void;
  setModalMode: (mode: 'add' | 'edit') => void;
  setDeleteModalOpen: (open: boolean) => void;
}

export function CustomerTableSection({
  customers,
  filteredCustomers,
  isDark,
  setSelectedCustomer,
  setViewModalOpen,
  setModalMode,
  setDeleteModalOpen
}: CustomerTableSectionProps) {
  const stickyBg = isDark ? 'bg-[#1e293b]' : 'bg-white';
  const borderColor = isDark ? 'border-[#334155]' : 'border-gray-200';
  const headerBg = isDark ? 'bg-gray-700' : 'bg-gray-50';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const mutedTextColor = isDark ? 'text-gray-400' : 'text-gray-600';

  return (
    /* Scrollable Table Container - FIXED IMPLEMENTATION */
    <div className={`flex-1 rounded-2xl border overflow-hidden flex flex-col ${stickyBg} ${borderColor}`}>
      <div className="relative overflow-auto" style={{ height: '100%', minWidth: '2500px' }}>
        <table className="w-full text-sm border-collapse" style={{ minWidth: '3000px', width: '3000px' }}>
          <thead className={`sticky top-0 z-20 ${headerBg}`}>
            <tr className={`border-b uppercase tracking-wider text-xs font-bold ${borderColor} ${mutedTextColor}`}>
              <th className="py-4 px-4 text-left whitespace-nowrap min-w-[150px]">Id</th>
              <th className="py-4 px-4 text-left whitespace-nowrap min-w-[120px]">Landline</th>
              <th className="py-4 px-4 text-left whitespace-nowrap min-w-[200px]">Name</th>
              <th className="py-4 px-4 text-left whitespace-nowrap min-w-[140px]">Mobile No</th>
              <th className="py-4 px-4 text-left whitespace-nowrap min-w-[180px]">Alternative Mobile No</th>
              <th className="py-4 px-4 text-left whitespace-nowrap min-w-[100px]">Vlan Id</th>
              <th className="py-4 px-4 text-left whitespace-nowrap min-w-[200px]">BB Id</th>
              <th className="py-4 px-4 text-left whitespace-nowrap min-w-[150px]">Voip Password</th>
              <th className="py-4 px-4 text-left whitespace-nowrap min-w-[130px]">ONT Make</th>
              <th className="py-4 px-4 text-left whitespace-nowrap min-w-[130px]">ONT Type</th>
              <th className="py-4 px-4 text-left whitespace-nowrap min-w-[180px]">ONT Mac Address</th>
              <th className="py-4 px-4 text-left whitespace-nowrap min-w-[130px]">ONT Bill No</th>
              <th className="py-4 px-4 text-left whitespace-nowrap min-w-[120px]">ONT</th>
              <th className="py-4 px-4 text-left whitespace-nowrap min-w-[120px]">Offer Prize</th>
              <th className="py-4 px-4 text-left whitespace-nowrap min-w-[140px]">Router Make</th>
              <th className="py-4 px-4 text-left whitespace-nowrap min-w-[160px]">Router Mac Id</th>
              <th className="py-4 px-4 text-left whitespace-nowrap min-w-[140px]">OLT IP</th>
              <th className="py-4 px-4 text-left whitespace-nowrap min-w-[160px]">Installation Date</th>
              
              {/* FIXED Sticky Header Columns */}
              <th className={`py-4 px-4 text-center whitespace-nowrap sticky right-[160px] z-30 ${headerBg}`}>Status</th>
              <th className={`py-4 px-4 text-center whitespace-nowrap sticky right-0 z-30 ${headerBg}`}>Options</th>
            </tr>
          </thead>
           
          <tbody className={`divide-y ${borderColor}`}>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className={`group ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                <td className={`py-3 px-4 font-medium ${textColor}`}>{customer.id}</td>
                <td className={`py-3 px-4 ${mutedTextColor}`}>{customer.landline}</td>
                <td className={`py-3 px-4 font-medium ${textColor}`}>{customer.name}</td>
                <td className={`py-3 px-4 ${mutedTextColor}`}>{customer.mobileNo}</td>
                <td className={`py-3 px-4 ${mutedTextColor}`}>{customer.altMobileNo}</td>
                <td className={`py-3 px-4 ${mutedTextColor}`}>{customer.vlanId}</td>
                <td className={`py-3 px-4 text-cyan-500 font-medium`}>{customer.bbId}</td>
                <td className={`py-3 px-4 font-mono text-xs ${mutedTextColor}`}>{customer.voipPassword}</td>
                <td className={`py-3 px-4 ${mutedTextColor}`}>{customer.ontMake}</td>
                <td className={`py-3 px-4 ${mutedTextColor}`}>{customer.ontType}</td>
                <td className={`py-3 px-4 font-mono text-xs ${mutedTextColor}`}>{customer.ontMacAddress}</td>
                <td className={`py-3 px-4 ${mutedTextColor}`}>{customer.ontBillNo}</td>
                <td className={`py-3 px-4 ${mutedTextColor}`}>{customer.ont}</td>
                <td className={`py-3 px-4 text-green-500 font-medium`}>{customer.offerPrize}</td>
                <td className={`py-3 px-4 ${mutedTextColor}`}>{customer.routerMake}</td>
                <td className={`py-3 px-4 font-mono text-xs ${mutedTextColor}`}>{customer.routerMacId}</td>
                <td className={`py-3 px-4 font-mono text-xs ${mutedTextColor}`}>{customer.oltIp}</td>
                <td className={`py-3 px-4 ${mutedTextColor}`}>{customer.installationDate}</td>
                
                {/* FIXED Sticky Data Columns */}
                <td className={`py-3 px-4 text-center whitespace-nowrap sticky right-[160px] z-10 ${stickyBg} border-l ${borderColor}`}>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                      customer.status === 'Active'
                        ? 'bg-green-500 text-white shadow-md shadow-green-500/20'
                        : 'bg-red-500 text-white shadow-md shadow-red-500/20'
                  }`}>
                    {customer.status}
                  </span>
                </td>

                <td className={`py-3 px-4 text-center whitespace-nowrap sticky right-0 z-10 ${stickyBg}`}>
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => { setSelectedCustomer(customer); setViewModalOpen(true); }} className="p-1.5 hover:bg-cyan-500/10 text-cyan-500 rounded transition-colors"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => { setSelectedCustomer(customer); setModalMode('edit'); }} className="p-1.5 hover:bg-blue-500/10 text-blue-500 rounded transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => { setSelectedCustomer(customer); setDeleteModalOpen(true); }} className="p-1.5 hover:bg-red-500/10 text-red-500 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Results Summary */}
      <div className={`px-6 py-3 border-t flex-shrink-0 ${borderColor} ${mutedTextColor} text-sm`}>
        Showing {filteredCustomers.length} of {customers.length} records
      </div>
    </div>
  );
}