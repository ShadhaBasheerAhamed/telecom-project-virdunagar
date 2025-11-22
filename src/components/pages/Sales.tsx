import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from './Inventory';

interface SalesProps {
  theme: 'light' | 'dark';
}

interface CartItem extends Product {
  qty: number;
}

const INVENTORY_KEY = 'inventory-data';

export function Sales({ theme }: SalesProps) {
  const isDark = theme === 'dark';
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load Inventory
  useEffect(() => {
    const stored = localStorage.getItem(INVENTORY_KEY);
    if (stored) setProducts(JSON.parse(stored));
  }, []);

  // Update Inventory in Storage (After Sale)
  const updateInventory = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(updatedProducts));
  };

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
            const newQty = item.qty + delta;
            if (newQty > item.stock) {
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

    if(confirm("Confirm Sale and Generate Invoice?")) {
        // 1. Deduct Stock
        const updatedInventory = products.map(p => {
            const cartItem = cart.find(c => c.id === p.id);
            if (cartItem) {
                return { ...p, stock: p.stock - cartItem.qty };
            }
            return p;
        });

        updateInventory(updatedInventory);
        setCart([]);
        toast.success("Sale Completed! Stock updated.");
        // Trigger WhatsApp or PDF generation here in future
    }
  };

  const { subtotal, gstAmount, total } = calculateTotal();
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className={`flex flex-col lg:flex-row h-screen overflow-hidden ${isDark ? 'bg-[#1a1f2c] text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* LEFT SIDE: PRODUCT GRID */}
      <div className="flex-1 flex flex-col overflow-hidden p-4">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Sales Point</h2>
            <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search items..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'}`}
                />
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pb-20 custom-scrollbar">
            {filteredProducts.map(product => (
                <div key={product.id} className={`p-3 rounded-xl border flex gap-3 hover:shadow-lg transition ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
                    <div className="w-20 h-20 bg-gray-700/30 rounded-lg overflow-hidden shrink-0">
                        {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">No Img</div>}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold line-clamp-1">{product.name}</h3>
                            <p className="text-xs text-gray-400">Stock: {product.stock}</p>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="font-bold text-green-500">₹{product.sellPrice}</span>
                            <button 
                                onClick={() => addToCart(product)}
                                disabled={product.stock <= 0}
                                className={`px-3 py-1 rounded text-xs font-bold ${product.stock > 0 ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                            >
                                {product.stock > 0 ? 'Add' : 'No Stock'}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* RIGHT SIDE: CART */}
      <div className={`w-full lg:w-96 flex flex-col border-l ${isDark ? 'bg-[#111827] border-slate-700' : 'bg-white border-gray-200'} shadow-2xl z-10`}>
        <div className="p-4 border-b border-inherit flex items-center gap-2">
            <ShoppingCart className="text-blue-500" />
            <h2 className="font-bold text-lg">Current Order</h2>
            <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-1 rounded-full">{cart.length} Items</span>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                    <ShoppingCart className="w-12 h-12 mb-2" />
                    <p>Cart is empty</p>
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

        {/* Footer / Total */}
        <div className={`p-4 border-t ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
            <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-400"><span>GST (18%)</span><span>₹{gstAmount.toFixed(2)}</span></div>
                <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-gray-700">
                    <span>Total</span><span>₹{total.toFixed(2)}</span>
                </div>
            </div>
            <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${cart.length > 0 ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
            >
                <CheckCircle className="w-5 h-5" /> Checkout & Print
            </button>
        </div>
      </div>

    </div>
  );
}