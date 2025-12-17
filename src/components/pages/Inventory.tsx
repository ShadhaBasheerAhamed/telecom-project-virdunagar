import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit, Trash2, Package, Upload, ShoppingCart, Minus, CheckCircle, User, Phone, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { WhatsAppService } from '../../services/whatsappService';

// ✅ 1. Import Search Context
import { useSearch } from '../../contexts/SearchContext';

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
  unit: 'Nos' | 'Mtr'; 
  gst: number; // Percentage (e.g., 18)
  image: string; // Base64 or URL
}

interface CartItem extends Product {
  qty: number;
}

const INVENTORY_KEY = 'inventory-data';

// Mock Data
const mockProducts: Product[] = [
    {
        id: '1',
        name: 'Dual Band Router',
        description: 'High speed dual band router with 4 antennas',
        category: 'Router',
        buyPrice: 1200,
        sellPrice: 1800,
        stock: 50,
        unit: 'Nos',
        gst: 18,
        image: ''
    },
    {
        id: '2',
        name: 'Fiber Cable (Drop)',
        description: 'Outdoor fiber drop cable',
        category: 'Cable',
        buyPrice: 5,
        sellPrice: 12,
        stock: 1000,
        unit: 'Mtr',
        gst: 18,
        image: ''
    }
];

export function Inventory({ theme }: InventoryProps) {
  const isDark = theme === 'dark';
  
  // ✅ 2. Use Global Search
  const { searchQuery } = useSearch();

  // --- SHARED STATE ---
  const [products, setProducts] = useState<Product[]>([]);
  
  // --- INVENTORY STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Product>({
    id: '', name: '', description: '', category: 'Modem', 
    buyPrice: 0, sellPrice: 0, stock: 0, unit: 'Nos', gst: 18, image: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- SALES STATE ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Load Data
  useEffect(() => {
    const stored = localStorage.getItem(INVENTORY_KEY);
    if (stored) {
        setProducts(JSON.parse(stored));
    } else {
        setProducts(mockProducts);
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(mockProducts));
    }
  }, []);

  const updateStorage = (data: Product[]) => {
    setProducts(data);
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(data));
  };

  // --- INVENTORY FUNCTIONS ---
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
      toast.success("Stock Added!");
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

  // --- SALES FUNCTIONS ---
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
        toast.error("Out of stock!");
        return;
    }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        if (existing.qty >= product.stock) {
            toast.error("Cannot add more than available stock");
            return;
        }
        setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
        setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(item => {
        if (item.id === id) {
            const product = products.find(p => p.id === id);
            const maxStock = product ? product.stock : 0;
            const newQty = item.qty + delta;
            
            if (newQty > maxStock) {
                toast.error("Stock limit reached");
                return item;
            }
            return newQty > 0 ? { ...item, qty: newQty } : item;
        }
        return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.sellPrice * item.qty), 0);
    const gstAmount = cart.reduce((sum, item) => sum + ((item.sellPrice * item.qty * item.gst) / 100), 0);
    return { subtotal, gstAmount, total: subtotal + gstAmount };
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (!customerName.trim() || !customerPhone.trim()) {
        toast.error("Enter Customer details for billing");
        return;
    }

    const { total } = calculateTotal();

    if(confirm(`Confirm sale for ₹${total.toFixed(2)}?`)) {
        // 1. Deduct Stock
        const updatedInventory = products.map(p => {
            const cartItem = cart.find(c => c.id === p.id);
            if (cartItem) {
                return { ...p, stock: p.stock - cartItem.qty };
            }
            return p;
        });
        updateStorage(updatedInventory);

        // 2. Generate WhatsApp Bill
        const itemsList = cart.map(item => `${item.name} (x${item.qty}): ₹${(item.sellPrice * item.qty).toFixed(2)}`).join('\n');
        WhatsAppService.sendInvoice(customerName, customerPhone, itemsList, parseFloat(total.toFixed(2)));

        // 3. Reset
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        toast.success("Sale Completed! Invoice sent.");
    }
  };

  // ✅ 3. FILTERS (Updated to use Global Search + Local Search)
  const filteredProducts = products.filter(p => {
    const globalMatch = !searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const localMatch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());

    return globalMatch && localMatch;
  });

  const salesFilteredProducts = products.filter(p => {
    const globalMatch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const localMatch = p.name.toLowerCase().includes(salesSearchTerm.toLowerCase());
    
    return globalMatch && localMatch;
  });

  const inputClass = `w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 outline-none`;

  return (
    <div className={`p-6 min-h-screen ${isDark ? 'bg-[#1a1f2c] text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
             <Package className="w-8 h-8 text-blue-500" /> Inventory & Sales System
           </h1>
           <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Manage stock levels and process sales invoices efficiently.</p>
        </div>
      </div>

      <Tabs defaultValue="stock" className="w-full space-y-8">
        <TabsList className={`inline-flex h-auto p-1.5 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          <TabsTrigger 
            value="stock" 
            className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
               isDark 
                 ? 'data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 hover:text-slate-200' 
                 : 'data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-gray-500 hover:text-gray-700'
            }`}
          >
            📦 Stock Management
          </TabsTrigger>
          <TabsTrigger 
            value="sales" 
            className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
               isDark 
                 ? 'data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400 hover:text-slate-200' 
                 : 'data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 text-gray-500 hover:text-gray-700'
            }`}
          >
            🛒 Sales Terminal (POS)
          </TabsTrigger>
        </TabsList>

        {/* --- TAB 1: STOCK MANAGEMENT --- */}
        <TabsContent value="stock" className="space-y-6 animate-in fade-in-50 duration-500">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search stock..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'}`}
                    />
                </div>
                <button 
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Add Product / Purchase
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                <div key={product.id} className={`rounded-xl border p-4 flex flex-col gap-3 transition-all hover:shadow-xl ${isDark ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-white border-gray-200 shadow-sm hover:bg-gray-50'}`}>
                    <div className="h-40 w-full bg-gray-700/20 rounded-lg overflow-hidden flex items-center justify-center relative group">
                        {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon className="w-12 h-12 text-gray-400" />
                        )}
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm shadow-sm">
                            Stock: {product.stock} {product.unit}
                        </div>
                    </div>
                    
                    <div>
                        <div className="flex justify-between items-start">
                            <h3 className={`font-bold text-lg truncate ${isDark ? 'text-white' : 'text-gray-900'}`} title={product.name}>{product.name}</h3>
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-medium">{product.category}</span>
                        </div>
                        <p className={`text-sm mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {product.description}
                        </p>
                    </div>

                    <div className="mt-auto pt-3 border-t border-dashed border-gray-500/30 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500">Selling (Inc. GST)</p>
                            <p className="text-lg font-bold text-green-500">₹{product.sellPrice}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleEdit(product)} className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
                ))}
            </div>
        </TabsContent>

        {/* --- TAB 2: SALES TERMINAL --- */}
        <TabsContent value="sales" className="flex flex-col lg:flex-row gap-6 h-[80vh] animate-in fade-in-50 duration-500">
            {/* Left: Product List */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search items for sale..." 
                        value={salesSearchTerm}
                        onChange={(e) => setSalesSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'}`}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pb-4 custom-scrollbar">
                    {salesFilteredProducts.map(product => (
                        <div key={product.id} className={`p-3 rounded-xl border flex gap-3 hover:shadow-md transition cursor-pointer ${isDark ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-white border-gray-200 hover:bg-gray-50'}`} onClick={() => addToCart(product)}>
                            <div className="w-16 h-16 bg-gray-700/30 rounded-lg overflow-hidden shrink-0">
                                {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">No Img</div>}
                            </div>
                            <div className="flex-1">
                                <h3 className={`font-bold line-clamp-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{product.name}</h3>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-sm text-gray-400">Stock: {product.stock}</span>
                                    <span className="font-bold text-green-500">₹{product.sellPrice}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Cart */}
            <div className={`w-full lg:w-96 flex flex-col border rounded-xl shadow-2xl overflow-hidden ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className={`p-4 border-b z-10 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                    <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-blue-500" /> Current Order</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                            <p>Select items to add to cart</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className={`p-3 rounded-lg flex justify-between items-center ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                <div className="flex-1">
                                    <p className="font-bold text-sm line-clamp-1">{item.name}</p>
                                    <p className="text-xs text-gray-400">₹{item.sellPrice} x {item.qty}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-gray-600 rounded"><Minus className="w-3 h-3" /></button>
                                    <span className="font-bold w-4 text-center text-sm">{item.qty}</span>
                                    <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-gray-600 rounded"><Plus className="w-3 h-3" /></button>
                                    <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-400 hover:bg-red-900/20 rounded ml-1"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className={`p-4 border-t ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="space-y-3 mb-4">
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input type="text" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={`${inputClass} pl-10`} />
                        </div>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input type="tel" placeholder="WhatsApp Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={`${inputClass} pl-10`} />
                        </div>
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-2 border-t border-dashed border-gray-600 mb-4">
                        <span>Total</span><span>₹{calculateTotal().total.toFixed(2)}</span>
                    </div>
                    <button onClick={handleCheckout} disabled={cart.length === 0} className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${cart.length > 0 ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
                        <CheckCircle className="w-5 h-5" /> Checkout & Send Bill
                    </button>
                </div>
            </div>
        </TabsContent>
      </Tabs>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl rounded-2xl p-8 border shadow-2xl ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white text-gray-900'}`}>
            <h2 className="text-xl font-bold mb-6">{editMode ? 'Edit Product' : 'Add New Product / Purchase'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 flex items-center gap-4 p-4 border border-dashed rounded-xl border-gray-500/50">
                <div onClick={() => fileInputRef.current?.click()} className="h-20 w-20 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer border border-gray-300 dark:border-slate-600">
                  {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <Upload className="text-gray-400" />}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-bold">Product Image</p>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md mt-2">Choose File</button>
                </div>
              </div>
              <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 block mb-1">Product Name</label><input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} /></div>
              <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 block mb-1">Description</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={inputClass} rows={2} /></div>
              <div><label className="text-xs font-bold text-gray-500 block mb-1">Category</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={inputClass}><option>Modem</option><option>Cable</option><option>Accessories</option><option>Router</option></select></div>
              <div className="flex gap-2">
                  <div className="flex-1"><label className="text-xs font-bold text-gray-500 block mb-1">Stock</label><input type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} className={inputClass} /></div>
                  <div className="w-24"><label className="text-xs font-bold text-gray-500 block mb-1">Unit</label><select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value as 'Nos' | 'Mtr'})} className={inputClass}><option value="Nos">Nos</option><option value="Mtr">Mtr</option></select></div>
              </div>
              <div><label className="text-xs font-bold text-gray-500 block mb-1">Buy Price (₹)</label><input type="number" required value={formData.buyPrice} onChange={e => setFormData({...formData, buyPrice: parseFloat(e.target.value)})} className={inputClass} /></div>
              <div><label className="text-xs font-bold text-gray-500 block mb-1">Sell Price (₹)</label><input type="number" required value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: parseFloat(e.target.value)})} className={inputClass} /></div>
              <div><label className="text-xs font-bold text-gray-500 block mb-1">GST (%)</label><input type="number" value={formData.gst} onChange={e => setFormData({...formData, gst: parseFloat(e.target.value)})} className={inputClass} /></div>
              <div className="flex justify-end md:col-span-2 gap-3 mt-6 border-t pt-6 border-gray-700">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold bg-gray-700 text-white">Cancel</button>
                <button type="submit" className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold">{editMode ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}