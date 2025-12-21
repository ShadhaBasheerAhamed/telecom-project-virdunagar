import { useState } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useNetworkProviders } from '../../hooks/useNetworkProviders';
import { NetworkProviderModal } from '../modals/NetworkProviderModal';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';

// ✅ 1. Import Search Context to enable global search functionality
import { useSearch } from '../../contexts/SearchContext';

interface NetworkProvidersProps {
  theme: 'light' | 'dark';
}

export function NetworkProviders({ theme }: NetworkProvidersProps) {
  const isDark = theme === 'dark';
  
  // ✅ 2. Use Global Search Hook
  // This connects the component to the global search state managed in SearchContext
  const { searchQuery, setSearchQuery } = useSearch();

  const {
    providers,
    isLoading,
    error,
    addProvider,
    updateProvider,
    deleteProvider,
    toggleProviderStatus,
    refresh
  } = useNetworkProviders();

  // Local state for filters and modals
  const [filterStatus, setFilterStatus] = useState('All');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // ✅ 3. Updated Filtering Logic
  // Filters providers based on both the global search query and the local status filter
  const filteredProviders = providers.filter(provider => {
    const searchLower = searchQuery.toLowerCase();
    
    // Search by Name or ID
    const matchesSearch = 
      provider.name.toLowerCase().includes(searchLower) ||
      provider.id.toLowerCase().includes(searchLower);
    
    // Filter by Status (Active/Inactive/All)
    const matchesStatus = filterStatus === 'All' || provider.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // --- CRUD Handlers ---

  // Handle adding a new provider
  const handleAddProvider = async (providerData: Omit<any, 'id'>) => {
    const success = await addProvider(providerData);
    if (success) {
      setModalMode(null);
    }
  };

  // Handle editing an existing provider
  const handleEditProvider = async (providerData: any) => {
    const success = await updateProvider(providerData.id, providerData);
    if (success) {
      setModalMode(null);
      setSelectedProvider(null);
    }
  };

  // Handle deleting a provider
  const handleDeleteProvider = async () => {
    if (!selectedProvider) return;
    const success = await deleteProvider(selectedProvider.id);
    if (success) {
      setDeleteModalOpen(false);
      setSelectedProvider(null);
    }
  };

  // Handle toggling provider status (Active/Inactive)
  const handleToggleStatus = async (id: string, currentStatus: 'Active' | 'Inactive') => {
    await toggleProviderStatus(id, currentStatus);
  };

  // Error State Render
  if (error) {
    return (
      <div className={`w-full p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
        <div className="text-center py-12">
          <p className="text-red-500">Error: {error}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* 🟢 CUSTOM SCROLLBAR STYLES */}
      {/* Dynamic styles for scrollbars based on the current theme (dark/light) */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDark ? '#2d3748' : '#f1f5f9'};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? '#4a5568' : '#cbd5e1'};
          border-radius: 4px;
          border: 2px solid ${isDark ? '#2d3748' : '#f1f5f9'};
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#718096' : '#94a3b8'};
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: ${isDark ? '#4a5568 #2d3748' : '#cbd5e1 #f1f5f9'};
        }
      `}</style>

      {/* 🟢 HEADER SECTION - REORGANIZED LAYOUT */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-end md:items-center p-4 rounded-lg border bg-inherit border-inherit shadow-sm">
        
        {/* 🟢 LEFT SIDE: Search Input */}
        {/* Search bar is placed on the left for consistency with other pages */}
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              className={`block w-full pl-10 pr-3 py-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
              placeholder="Search network providers..."
              value={searchQuery} // ✅ Binds to Global Search State
              onChange={(e) => setSearchQuery(e.target.value)} // ✅ Updates Global Search State
            />
        </div>
        
        {/* 🟢 RIGHT SIDE: Filters & Actions */}
        {/* Status filter and Add button are aligned to the right */}
        <div className="flex gap-3 w-full md:w-auto">
            {/* Status Filter Dropdown */}
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)} 
              className={`px-4 py-2 rounded-md border outline-none ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
            >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
            </select>

            {/* Add Provider Button */}
            <button onClick={() => setModalMode('add')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-lg transition-all">
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Provider</span>
            </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading network providers...</p>
        </div>
      ) : (
        /* 🟢 TABLE CONTAINER */
        /* Fixed height calculated to allow vertical scrolling within the table area */
        <div className={`rounded-xl border shadow-lg overflow-hidden flex flex-col ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`} style={{ height: 'calc(100vh - 220px)' }}>
          
          {/* Scrollable Table Area */}
          <div className="overflow-x-auto flex-1 custom-scrollbar relative">
            <table className="w-full text-sm text-left border-separate border-spacing-0">
              
              {/* Sticky Header */}
              <thead className={`uppercase font-bold sticky top-0 z-30 ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-gray-50 text-gray-600'}`}>
                <tr>
                  <th className="px-6 py-4 min-w-[100px] border-b border-inherit bg-inherit">ID</th>
                  <th className="px-6 py-4 min-w-[200px] border-b border-inherit bg-inherit">Provider Name</th>
                  <th className="px-6 py-4 min-w-[150px] border-b border-inherit bg-inherit">Created At</th>
                  
                  {/* Fixed Status Column Header */}
                  {/* Sticky to the right, with shadow for separation */}
                  <th className={`px-6 py-4 min-w-[120px] border-b border-inherit sticky right-[200px] z-30 shadow-[-5px_0px_10px_rgba(0,0,0,0.05)] ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>Status</th>
                  
                  {/* Fixed Actions Column Header */}
                  {/* Sticky to the far right */}
                  <th className={`px-6 py-4 text-center min-w-[200px] border-b border-inherit sticky right-0 z-30 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>Actions</th>
                </tr>
              </thead>
              
              <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
                {filteredProviders.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            No providers found matching "{searchQuery}"
                        </td>
                    </tr>
                ) : (
                    filteredProviders.map((provider) => (
                    <tr key={provider.id} className={`transition-colors group ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}>
                        <td className="px-6 py-4 font-medium border-b border-inherit">{provider.id}</td>
                        <td className="px-6 py-4 font-medium border-b border-inherit">{provider.name}</td>
                        <td className="px-6 py-4 border-b border-inherit">{new Date(provider.createdAt).toLocaleDateString()}</td>
                        
                        {/* 🟢 Sticky Status Body Cell */}
                        <td className={`px-6 py-4 border-b border-inherit sticky right-[200px] z-20 shadow-[-5px_0px_10px_rgba(0,0,0,0.05)] ${isDark ? 'bg-slate-800 group-hover:bg-slate-700/50' : 'bg-white group-hover:bg-gray-50'}`}>
                        <button
                            onClick={() => handleToggleStatus(provider.id, provider.status)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                                provider.status === 'Active' 
                                ? 'bg-green-500 text-white border-green-600 shadow-md shadow-green-500/20' 
                                : 'bg-red-500 text-white border-red-600 shadow-md shadow-red-500/20'
                            }`}
                        >
                            {provider.status}
                        </button>
                        </td>
                        
                        {/* 🟢 Sticky Actions Body Cell */}
                        <td className={`px-6 py-4 text-center border-b border-inherit sticky right-0 z-20 ${isDark ? 'bg-slate-800 group-hover:bg-slate-700/50' : 'bg-white group-hover:bg-gray-50'}`}>
                        <div className="flex items-center justify-center gap-2">
                            <button 
                            onClick={() => { setSelectedProvider(provider); setModalMode('edit'); }} 
                            className="p-1.5 text-yellow-400 hover:bg-yellow-500/10 rounded transition-colors" 
                            title="Edit"
                            >
                            <Edit className="w-4 h-4"/>
                            </button>
                            <button 
                            onClick={() => { setSelectedProvider(provider); setDeleteModalOpen(true); }} 
                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors" 
                            title="Delete"
                            >
                            <Trash2 className="w-4 h-4"/>
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer Section */}
          <div className={`px-6 py-4 border-t flex justify-between items-center ${isDark ? 'border-slate-700 bg-slate-900 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
              <div className="text-sm">
                  Showing {filteredProviders.length} of {providers.length} results
              </div>
              <button
                onClick={refresh}
                className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
              >
                Refresh
              </button>
          </div>
        </div>
      )}

      {/* MODALS */}
      {modalMode && (
        <NetworkProviderModal 
          mode={modalMode} 
          provider={selectedProvider} 
          theme={theme} 
          onClose={() => {
            setModalMode(null);
            setSelectedProvider(null);
          }} 
          onSave={(providerData) => {
            if (modalMode === 'add') {
              handleAddProvider(providerData);
            } else {
              handleEditProvider(providerData);
            }
          }} 
        />
      )}
      
      {deleteModalOpen && (
        <DeleteConfirmModal 
          title="Delete Network Provider" 
          message={`Are you sure you want to delete "${selectedProvider?.name}"?`} 
          theme={theme} 
          onConfirm={handleDeleteProvider} 
          onCancel={() => {
            setDeleteModalOpen(false);
            setSelectedProvider(null);
          }} 
        />
      )}
    </div>
  );
}