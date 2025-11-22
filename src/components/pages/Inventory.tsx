import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit, Trash2, Package, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface InventoryProps {
  theme: 'light' | 'dark';
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  unit: string; // Nos / Mtr
  gst: number;
  image: string; // Base64 or URL
}

const INVENTORY_KEY = 'inventory-data';

export function Inventory({ theme }: InventoryProps) {
  const isDark = theme === 'dark';
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Product>({
    id: '', name: '', description: '', category: 'Modem', 
    buyPrice: 0, sellPrice: 0, stock: 0, unit: 'Nos', gst: 18, image: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Data
  useEffect(() => {
    const stored = localStorage.getItem(INVENTORY_KEY);
    if (stored) setProducts(JSON.parse(stored));
  }, []);

  const updateStorage = (data: Product[]) => {
    setProducts(data);
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(data));
  };

  // Image Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editMode) {
      const updated = products.map(p => p.id === formData.id ? formData : p);
      updateStorage(updated);
      toast.success("Product updated!");
    } else {
      const newProduct = { ...formData, id: Date.now().toString() };
      updateStorage([newProduct, ...products]);
      toast.success("Product added to stock!");
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if(confirm('Delete this product?')) {
      updateStorage(products.filter(p => p.id !== id));
      toast.success("Product deleted");
    }
  };

  const handleEdit = (product: Product) => {
    setFormData(product);
    setEditMode(true);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      id: '', name: '', description: '', category: 'Modem', 
      buyPrice: 0, sellPrice: 0, stock: 0, unit: 'Nos', gst: 18, image: ''
    });
    setEditMode(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputClass = `w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 outline-none`;

  return (
    <div className={`p-6 min-h-screen ${isDark ? 'bg-[#1a1f2c] text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="text-blue-500" /> Inventory & Stock
        </h1>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'}`}
            />
          </div>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className={`rounded-xl border p-4 flex flex-col gap-3 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="h-40 w-full bg-gray-700/20 rounded-lg overflow-hidden flex items-center justify-center relative group">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-12 h-12 text-gray-400" />
              )}
              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
                Stock: {product.stock} {product.unit}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg truncate" title={product.name}>{product.name}</h3>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">{product.category}</span>
              </div>
              <p className={`text-sm mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {product.description}
              </p>
            </div>

            <div className="mt-auto pt-3 border-t border-gray-700/50 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Selling Price</p>
                <p className="text-lg font-bold text-green-500">₹{product.sellPrice}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(product)} className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl rounded-2xl p-6 ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-4">{editMode ? 'Edit Product' : 'Add New Product'}</h2>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 flex items-center gap-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`h-24 w-24 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden ${isDark ? 'border-slate-600 hover:border-blue-500' : 'border-gray-300'}`}
                >
                  {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <Upload className="text-gray-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Product Image</p>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-blue-500 hover:underline">Click to upload</button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs uppercase font-bold text-gray-500">Product Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs uppercase font-bold text-gray-500">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={inputClass} rows={2} />
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-gray-500">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={inputClass}>
                  <option>Modem</option>
                  <option>Cable</option>
                  <option>Accessories</option>
                  <option>Router</option>
                </select>
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-gray-500">Stock Quantity</label>
                <input type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} className={inputClass} />
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-gray-500">Buy Price (₹)</label>
                <input type="number" required value={formData.buyPrice} onChange={e => setFormData({...formData, buyPrice: parseFloat(e.target.value)})} className={inputClass} />
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-gray-500">Sell Price (₹)</label>
                <input type="number" required value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: parseFloat(e.target.value)})} className={inputClass} />
              </div>

              <div className="flex justify-end md:col-span-2 gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg bg-gray-600 text-white">Cancel</button>
                <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}