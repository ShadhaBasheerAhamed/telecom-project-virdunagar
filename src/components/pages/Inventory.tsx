import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Edit, Trash2, Package, Upload, ShoppingCart, Minus, 
  CheckCircle, User, Phone, Image as ImageIcon, Mail, History, Calendar, 
  Save, X, ChevronDown, Check 
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { WhatsAppService } from '../../services/whatsappService';
import { PDFService } from '../../services/pdfService';
import { EmailService } from '../../services/emailService';

// Firebase Imports
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

import { useSearch } from '../../contexts/SearchContext';
import { capitalizeFirst, capitalizeWords } from '../../utils/textFormat';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
  gst: number; 
  image: string;
  // --- NEW FIELDS FOR MODEM/HARDWARE ---
  routerMake?: string;
  ontMake?: string;
  ontType?: string;
  macAddress?: string;
  createdAt?: string;
}

interface CartItem extends Product {
  qty: number;
}

interface SaleRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: CartItem[];
  totalAmount: number;
  date: string;     
  timestamp: number; 
}

// --- CUSTOM DROPDOWN COMPONENT (FIXED SCROLLBAR) ---
const QuickMasterSelect = ({ label, value, onChange, collectionName, options, theme }: any) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [newValue, setNewValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Input style without blue ring
  const inputClass = `w-full px-4 py-2 rounded-lg border outline-none transition-colors 
    ${isDark 
      ? 'bg-slate-800 border-slate-600 text-white focus:border-blue-500' 
      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'}`;

  const handleSaveNew = async () => {
    if (!newValue.trim()) return;
    try {
      await addDoc(collection(db, collectionName), {
        name: capitalizeFirst(newValue.trim()),
        status: 'Active',
        createdAt: new Date().toISOString()
      });
      toast.success(`${newValue} added!`);
      onChange(capitalizeWords(newValue.trim()));

      setIsAdding(false);
      setNewValue('');
    } catch (error) {
      console.error(`Error adding to ${collectionName}:`, error);
      toast.error("Failed to add record");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-xs font-bold text-gray-500 block mb-1">{label}</label>
      
      {isAdding ? (
        <div className="flex gap-2 animate-in fade-in zoom-in-95">
          <input 
            type="text" 
            placeholder={`Enter new ${label}`}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className={inputClass}
            autoFocus
          />
          <button type="button" onClick={handleSaveNew} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><Save className="w-4 h-4" /></button>
          <button type="button" onClick={() => setIsAdding(false)} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <div className="flex gap-2 relative">
          {/* Trigger */}
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className={`${inputClass} cursor-pointer flex justify-between items-center`}
          >
            <span className={!value ? 'text-gray-500' : ''}>
              {value || `Select ${label}`}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} text-gray-400`} />
          </div>

          <button type="button" onClick={() => setIsAdding(true)} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shrink-0" title="Add New"><Plus className="w-4 h-4" /></button>

          {/* Dropdown List with Themed Scrollbar */}
          {isOpen && (
            <div className={`absolute top-full left-0 mt-1 w-[calc(100%-3rem)] z-50 rounded-lg border shadow-xl max-h-60 overflow-y-auto custom-scrollbar
              ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'}
            `}>
              {options && options.length > 0 ? (
                options.map((opt: any) => (
                  <div 
                    key={opt.id} 
                    onClick={() => { onChange(opt.name); setIsOpen(false); }}
                    className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors
                      ${isDark ? 'hover:bg-slate-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}
                      ${value === opt.name ? (isDark ? 'bg-slate-700/50 text-blue-400' : 'bg-blue-50 text-blue-600') : ''}
                    `}
                  >
                    {opt.name}
                    {value === opt.name && <Check className="w-4 h-4" />}
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">No options found</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export function Inventory({ theme }: InventoryProps) {
  const isDark = theme === 'dark';
  const { searchQuery } = useSearch();

  // --- SHARED STATE ---
  const [products, setProducts] = useState<Product[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- MASTER DATA STATE ---
  const [masterData, setMasterData] = useState<{ [key: string]: any[] }>({
    routerMake: [],
    ontMake: [],
    ontType: []
  });

  // --- INVENTORY STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Product>({
    id: '', name: '', description: '', category: 'Modem', 
    buyPrice: 0, sellPrice: 0, stock: 0, unit: 'Nos', gst: 18, image: '',
    routerMake: '', ontMake: '', ontType: '', macAddress: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- SALES STATE ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // --- GLOBAL CSS (Scrollbars & Number Inputs) ---
  const globalStyles = `
    /* Hide number input spinners */
    input[type=number]::-webkit-inner-spin-button, 
    input[type=number]::-webkit-outer-spin-button { 
      -webkit-appearance: none; 
      margin: 0; 
    }
    input[type=number] { -moz-appearance: textfield; }

    /* Custom Thin Scrollbar */
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: ${isDark ? '#1e293b' : '#f1f5f9'}; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDark ? '#64748b' : '#94a3b8'}; }
  `;

  // --- 1. LISTENER FOR PRODUCTS ---
  useEffect(() => {
    setLoading(true);

    const productsQuery = query(collection(db, 'products'), orderBy('name'));

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        const productsData: Product[] = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<Product, 'id'>)
          }));

        setProducts(productsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching products:", error);
        toast.error("Failed to load inventory.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // --- 2. LISTENER FOR SALES HISTORY ---
  useEffect(() => {
    const q = query(collection(db, 'sales'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SaleRecord[];
      setSalesHistory(historyData);
    });
    return () => unsubscribe();
  }, []);

  // --- 3. LISTENER FOR MASTER RECORDS (SEPARATE COLLECTIONS) ---
  useEffect(() => {
    const unsubRouter = onSnapshot(collection(db, 'router_makes'), (snap) => {
      setMasterData(prev => ({ ...prev, routerMake: snap.docs.map(d => ({ id: d.id, ...d.data() })) }));
    });
    const unsubOntMake = onSnapshot(collection(db, 'ont_makes'), (snap) => {
      setMasterData(prev => ({ ...prev, ontMake: snap.docs.map(d => ({ id: d.id, ...d.data() })) }));
    });
    const unsubOntType = onSnapshot(collection(db, 'ont_types'), (snap) => {
      setMasterData(prev => ({ ...prev, ontType: snap.docs.map(d => ({ id: d.id, ...d.data() })) }));
    });

    return () => { unsubRouter(); unsubOntMake(); unsubOntType(); };
  }, []);


  // --- INVENTORY FUNCTIONS ---
  
  // ✅ OLD IMAGE UPLOAD FUNCTION (Base64 - Works Immediately)
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

  // ✅ UPDATED SAVE FUNCTION (Fixes Capitalization & Number Storage)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const commonData = {
        name: capitalizeWords(formData.name),
        description: capitalizeFirst(formData.description),
        category: formData.category,
        // Ensure Numbers are Numbers
        buyPrice: Number(formData.buyPrice) || 0,
        sellPrice: Number(formData.sellPrice) || 0,
        stock: Number(formData.stock) || 0,
        unit: formData.unit,
        gst: Number(formData.gst) || 0,
        image: formData.image || '', // Ensure valid string
      };

      // Add Hardware specific fields only if category is 'Modem'
      const specificData = formData.category === 'Modem' ? {
        routerMake: formData.routerMake || '',
        ontMake: formData.ontMake || '',
        ontType: formData.ontType || '',
        macAddress: formData.macAddress || ''
      } : {
        routerMake: '', ontMake: '', ontType: '', macAddress: ''
      };

      if (editMode && formData.id) {
        const productRef = doc(db, 'products', formData.id);
        await updateDoc(productRef, { ...commonData, ...specificData });
        toast.success("Product updated successfully!");
      } else {
        const newProductData = {
          ...commonData,
          ...specificData,
          createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'products'), newProductData);
        toast.success("Product added successfully!");
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product.");
    }
  };
  
  // ✅ SAFE EDIT HANDLER (Preserves image)
  const handleEdit = (product: Product) => {
    setFormData({
        ...product,
        image: product.image || '' 
    });
    setEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '', name: '', description: '', category: 'Modem', 
      buyPrice: 0, sellPrice: 0, stock: 0, unit: 'Nos', gst: 18, image: '',
      routerMake: '', ontMake: '', ontType: '', macAddress: ''
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
    return { total: subtotal };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!customerName.trim() || !customerPhone.trim()) {
        toast.error("Enter Customer Name and WhatsApp Number");
        return;
    }

    const { total } = calculateTotal();

    if(confirm(`Confirm sale for ₹${total.toFixed(2)}?`)) {
        try {
            // 1. Update Stock
            for (const item of cart) {
                const productRef = doc(db, 'products', item.id);
                const currentStock = products.find(p => p.id === item.id)?.stock || 0;
                await updateDoc(productRef, {
                    stock: currentStock - item.qty
                });
            }

            // 2. Save Sales Record
            const salesData = {
              customerName,
              customerPhone,
              customerEmail,
              items: cart,
              totalAmount: total,
              date: new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString('en-IN'),
              timestamp: Date.now()
            };
            await addDoc(collection(db, 'sales'), salesData);


            // 3. Generate PDF
            const invoiceGenerated = PDFService.generateProductInvoice(cart, {
                name: customerName,
                phone: customerPhone,
                email: customerEmail,
                date: new Date().toISOString().split('T')[0],
                total: total
            });

            if (invoiceGenerated) toast.success("Invoice Downloaded!");

            // 4. Send WhatsApp
            const itemsList = cart.map(item => `${item.name} (x${item.qty})`).join(', ');
            // @ts-ignore
            if (WhatsAppService.sendInvoice) {
                // @ts-ignore
                WhatsAppService.sendInvoice(customerName, customerPhone, itemsList, parseFloat(total.toFixed(2)));
            }

            // 5. Send Email
            if (customerEmail) {
                EmailService.sendProductInvoiceEmail({
                    name: customerName,
                    email: customerEmail,
                    total: total,
                    items: cart
                });
            }

            setCart([]);
            setCustomerName('');
            setCustomerPhone('');
            setCustomerEmail('');
            toast.success("Sale Recorded Successfully!");

        } catch (error) {
            console.error("Checkout Error:", error);
            toast.error("Checkout failed. Please try again.");
        }
    }
  };

  // --- FILTERS ---
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

  // Styles
  const inputClass = `w-full px-4 py-2 rounded-lg border outline-none transition-colors 
    ${isDark 
      ? 'bg-slate-800 border-slate-600 text-white focus:border-blue-500' 
      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'}`;

  // Helper to prevent scrolling on number inputs
  const preventScroll = (e: React.WheelEvent<HTMLInputElement>) => { e.currentTarget.blur(); };

  
  return (
    <div className={`p-6 min-h-screen ${isDark ? 'bg-[#1a1f2c] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <style>{globalStyles}</style>

      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
             <Package className="w-8 h-8 text-blue-500" /> Inventory & Sales System
           </h1>
           <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Manage stock levels, process sales, and view history.</p>
        </div>
      </div>

      <Tabs defaultValue="stock" className="w-full space-y-8">
        <TabsList className={`inline-flex h-auto p-1.5 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          <TabsTrigger value="stock" className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${isDark ? 'data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 hover:text-slate-200' : 'data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-gray-500 hover:text-gray-700'}`}>
            📦 Stock Management
          </TabsTrigger>
          <TabsTrigger value="sales" className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${isDark ? 'data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400 hover:text-slate-200' : 'data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 text-gray-500 hover:text-gray-700'}`}>
            🛒 Sales Terminal
          </TabsTrigger>
          <TabsTrigger value="history" className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${isDark ? 'data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400 hover:text-slate-200' : 'data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 text-gray-500 hover:text-gray-700'}`}>
            <History className="w-4 h-4" /> Sales History
          </TabsTrigger>
        </TabsList>

        {/* --- TAB 1: STOCK MANAGEMENT --- */}
        <TabsContent value="stock" className="space-y-6 animate-in fade-in-50 duration-500">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search stock..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-10 pr-4 py-2 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'}`} />
                </div>
                <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-transform active:scale-95">
                    <Plus className="w-4 h-4" /> Add Product / Purchase
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map(product => (
                    <div key={product.id} className={`rounded-xl border p-4 flex flex-col gap-3 transition-all hover:shadow-xl ${isDark ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-white border-gray-200 shadow-sm hover:bg-gray-50'}`}>
                        <div className="h-40 w-full bg-gray-700/20 rounded-lg overflow-hidden flex items-center justify-center relative group">
                            {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-12 h-12 text-gray-400" />}
                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm shadow-sm">Stock: {product.stock} {product.unit}</div>
                        </div>
                        
                        <div>
                            <div className="flex justify-between items-start">
                                <h3 className={`font-bold text-lg truncate ${isDark ? 'text-white' : 'text-gray-900'}`} title={product.name}>{product.name}</h3>
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-medium">{product.category}</span>
                            </div>
                            <p className={`text-sm mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{product.description}</p>
                            
                            {/* Display extra fields for Modems */}
                            {product.category === 'Modem' && (
                              <div className="mt-2 text-xs space-y-1 p-2 rounded bg-gray-500/10">
                                {product.ontMake && <p><span className="opacity-70">ONT:</span> {product.ontMake} ({product.ontType})</p>}
                                {product.routerMake && <p><span className="opacity-70">Router:</span> {product.routerMake}</p>}
                                {product.macAddress && <p><span className="opacity-70">MAC:</span> <span className="font-mono">{product.macAddress}</span></p>}
                              </div>
                            )}
                        </div>

                        <div className="mt-auto pt-3 border-t border-dashed border-gray-500/30 flex justify-between items-center">
                            <div><p className="text-xs text-gray-500">Selling (Inc. GST)</p><p className="text-lg font-bold text-green-500">₹{product.sellPrice}</p></div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(product)} className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
            )}
        </TabsContent>

        {/* --- TAB 2: SALES TERMINAL --- */}
        <TabsContent value="sales" className="flex flex-col lg:flex-row gap-6 h-[85vh] animate-in fade-in-50 duration-500">
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search items for sale..." value={salesSearchTerm} onChange={(e) => setSalesSearchTerm(e.target.value)} className={`w-full pl-10 pr-4 py-2 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'}`} />
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

            <div className={`w-full lg:w-96 flex flex-col border rounded-xl shadow-2xl overflow-hidden ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className={`p-4 border-b z-10 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                    <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-blue-500" /> Current Order</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50"><p>Select items to add to cart</p></div>
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
                        <div className="relative"><User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /><input type="text" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(capitalizeFirst(e.target.value))} className={`${inputClass} pl-10`} /></div>
                        <div className="relative"><Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /><input type="tel" placeholder="WhatsApp Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={`${inputClass} pl-10`} /></div>
                        <div className="relative"><Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /><input type="email" placeholder="Email (Optional)" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className={`${inputClass} pl-10`} /></div>
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

        {/* --- TAB 3: SALES HISTORY --- */}
        <TabsContent value="history" className="animate-in fade-in-50 duration-500">
           <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className={`text-xs uppercase ${isDark ? 'bg-slate-900/50 text-slate-400' : 'bg-gray-50 text-gray-500'}`}>
                        <tr>
                          <th className="px-6 py-4 font-medium">Date</th>
                          <th className="px-6 py-4 font-medium">Customer Details</th>
                          <th className="px-6 py-4 font-medium">Items Purchased</th>
                          <th className="px-6 py-4 font-medium text-right">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/30">
                        {salesHistory.length === 0 ? (
                          <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No sales records found yet.</td></tr>
                        ) : (
                          salesHistory.map((sale) => (
                             <tr key={sale.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-50'}`}>
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-2 text-sm font-medium">
                                      <Calendar className="w-4 h-4 text-purple-500" />
                                      {sale.date}
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="flex flex-col gap-1">
                                      <span className="font-bold text-sm">{sale.customerName}</span>
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                          <Phone className="w-3 h-3" /> {sale.customerPhone}
                                      </div>
                                      {sale.customerEmail && (
                                          <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Mail className="w-3 h-3" /> {sale.customerEmail}
                                          </div>
                                      )}
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="flex flex-col gap-1">
                                      {sale.items.map((item, idx) => (
                                         <span key={idx} className="text-xs bg-gray-700/50 w-fit px-2 py-0.5 rounded-full text-gray-300 border border-gray-600">
                                            {item.name} <span className="text-gray-500">x{item.qty}</span>
                                         </span>
                                      ))}
                                   </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <span className="font-bold text-green-500">₹{sale.totalAmount.toFixed(2)}</span>
                                </td>
                             </tr>
                          ))
                        )}
                    </tbody>
                 </table>
              </div>
           </div>
        </TabsContent>

      </Tabs>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
  className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-8 border shadow-2xl custom-scrollbar
  ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white text-gray-900'}`}
>

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{editMode ? 'Edit Product' : 'Add New Product / Purchase'}</h2>
                <button onClick={() => setIsModalOpen(false)} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-black'}`}>
                    <X className="w-6 h-6" />
                </button>
            </div>

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
              <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 block mb-1">Product Name</label><input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: capitalizeWords(e.target.value)})} className={inputClass} /></div>
              
              <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 block mb-1">Description</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: capitalizeFirst(e.target.value)})} className={inputClass} rows={2} /></div>
              
              <div><label className="text-xs font-bold text-gray-500 block mb-1">Category</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={inputClass}><option>Modem</option><option>Cable</option><option>Accessories</option><option>Router</option></select></div>

              {formData.category === 'Modem' && (
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-gray-500/5 border border-dashed border-gray-500/20">
                    <div className="md:col-span-2 text-sm font-bold text-blue-500">Hardware Details</div>
                    
                    {/* CUSTOM DROPDOWNS LINKED TO FIRESTORE */}
                    <QuickMasterSelect label="Router Make" value={formData.routerMake} onChange={(val: string) => setFormData({...formData, routerMake: val})} collectionName="router_makes" options={masterData.routerMake} theme={theme} />
                    <QuickMasterSelect label="ONT Make" value={formData.ontMake} onChange={(val: string) => setFormData({...formData, ontMake: val})} collectionName="ont_makes" options={masterData.ontMake} theme={theme} />
                    <QuickMasterSelect label="ONT Type" value={formData.ontType} onChange={(val: string) => setFormData({...formData, ontType: val})} collectionName="ont_types" options={masterData.ontType} theme={theme} />
                    
                    <div><label className="text-xs font-bold text-gray-500 block mb-1">MAC / Serial No.</label><input type="text" value={formData.macAddress} onChange={e => setFormData({...formData, macAddress: e.target.value})} className={inputClass} placeholder="Optional" /></div>
                </div>
              )}

              <div className="flex gap-2">
                  <div className="flex-1"><label className="text-xs font-bold text-gray-500 block mb-1">Stock</label><input type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value) || 0})} onWheel={preventScroll} className={inputClass} /></div>
                  <div className="w-24"><label className="text-xs font-bold text-gray-500 block mb-1">Unit</label><select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value as 'Nos' | 'Mtr'})} className={inputClass}><option value="Nos">Nos</option><option value="Mtr">Mtr</option></select></div>
              </div>
              <div><label className="text-xs font-bold text-gray-500 block mb-1">Buy Price (₹)</label><input type="number" required value={formData.buyPrice} onChange={e => setFormData({...formData, buyPrice: Number(e.target.value)})} onWheel={preventScroll} className={inputClass} /></div>
              <div><label className="text-xs font-bold text-gray-500 block mb-1">Sell Price (₹)</label><input type="number" required value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: Number(e.target.value)})} onWheel={preventScroll} className={inputClass} /></div>
              <div><label className="text-xs font-bold text-gray-500 block mb-1">GST (%)</label><input type="number" value={formData.gst} onChange={e => setFormData({...formData, gst: Number(e.target.value)})} onWheel={preventScroll} className={inputClass} /></div>
              
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