import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

interface WalletCardProps {
  theme: 'light' | 'dark';
}

export function WalletCard({ theme }: WalletCardProps) {
  const [walletBalance, setWalletBalance] = useState<number>(0);

  useEffect(() => {
    const walletRef = doc(db, 'admin_wallet', 'main_wallet');
    const unsub = onSnapshot(walletRef, snap => {
      setWalletBalance(snap.exists() ? snap.data().currentBalance || 0 : 0);
    });
    return () => unsub();
  }, []);

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
            ? 'linear-gradient(135deg, #2563EB, #1E40AF)'
            : 'linear-gradient(135deg, #3B82F6, #2563EB)',
        color: 'white'
      }}
    >
      {/* ===== YOUR CONTENT (USED AS IS) ===== */}
      <div className="relative z-10 flex flex-col">
        <div className="flex items-center gap-2 mb-0.5 opacity-90">
          <Wallet className="w-3.5 h-3.5 text-white/90" />
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest">
            Wallet Balance
          </span>
        </div>

        <motion.div
          key={walletBalance}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-xl font-bold text-white tracking-tight"
        >
          INR <span className="font-mono">{walletBalance.toFixed(2)}</span>
        </motion.div>
      </div>
      {/* ==================================== */}
    </motion.div>
  );
}
