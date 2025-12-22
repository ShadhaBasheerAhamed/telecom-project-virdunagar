import { Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

// --- Interface Update ---
// Added 'amount' prop to receive dynamic data from the parent component (EnhancedDashboard)
interface WalletCardProps {
  theme: 'light' | 'dark';
  amount?: number; // ✅ NEW: Dynamic Amount Prop
}

export function WalletCard({ theme, amount = 0 }: WalletCardProps) {
  // Removed static Firestore subscription.
  // The value is now controlled entirely by the parent component.

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        relative overflow-hidden
        px-4 py-3
        rounded-2xl
        shadow-lg
        cursor-pointer
        min-w-[200px]
        max-w-[230px]
      "
      style={{
        background:
          theme === 'dark'
            ? 'linear-gradient(135deg, #2563EB, #1E40AF)' // Deep Blue for Dark Mode
            : 'linear-gradient(135deg, #3B82F6, #2563EB)', // Bright Blue for Light Mode
        color: 'white'
      }}
    >
      {/* ===== CONTENT ===== */}
      <div className="relative z-10 flex flex-col">
        <div className="flex items-center gap-2 mb-0.5 opacity-90">
          <Wallet className="w-3.5 h-3.5 text-white/90" />
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest">
            Today's Collection {/* Updated Label to reflect live data context */}
          </span>
        </div>

        {/* --- Display Dynamic Amount --- */}
        <motion.div
          key={amount} // Triggers a subtle re-render animation when amount updates
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-xl font-bold text-white tracking-tight"
        >
          INR <span className="font-mono">{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </motion.div>
      </div>
      
      {/* Decorative Blur Circle */}
      <div className="absolute -right-6 -bottom-10 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl" />
    </motion.div>
  );
}