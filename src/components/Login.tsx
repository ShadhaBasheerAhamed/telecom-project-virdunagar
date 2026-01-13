import { useState } from 'react';
import { Shield, Users, Wrench, Database } from 'lucide-react';
import { seedDatabase } from '../utils/seedData';

interface LoginProps {
  onLogin: (role: 'Super Admin' | 'Sales' | 'Maintenance') => void;
}

export function Login({ onLogin }: LoginProps) {
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedDatabase();
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700">
        <h1 className="text-3xl font-bold text-center mb-8 text-cyan-400">SPT TELECOM ERP</h1>
        <p className="text-center text-gray-400 mb-8">Select your role to login</p>

        <div className="space-y-4">
          <button
            onClick={() => onLogin('Super Admin')}
            className="w-full p-4 bg-gradient-to-r from-red-500 to-red-700 rounded-xl flex items-center justify-center gap-3 hover:scale-105 transition-transform"
          >
            <Shield className="w-6 h-6" />
            <span className="font-bold text-lg">Super Admin</span>
          </button>

          <button
            onClick={() => onLogin('Sales')}
            className="w-full p-4 bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl flex items-center justify-center gap-3 hover:scale-105 transition-transform"
          >
            <Users className="w-6 h-6" />
            <span className="font-bold text-lg">Sales Team</span>
          </button>

          <button
            onClick={() => onLogin('Maintenance')}
            className="w-full p-4 bg-gradient-to-r from-green-500 to-green-700 rounded-xl flex items-center justify-center gap-3 hover:scale-105 transition-transform"
          >
            <Wrench className="w-6 h-6" />
            <span className="font-bold text-lg">Maintenance Team</span>
          </button>

          <div className="pt-6 border-t border-slate-700 mt-6">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className={`w-full p-3 border border-slate-600 rounded-xl flex items-center justify-center gap-2 text-sm text-slate-400 hover:bg-slate-700 transition-colors ${seeding ? 'opacity-50 cursor-wait' : ''}`}
            >
              <Database className="w-4 h-4" />
              {seeding ? 'Seeding Database...' : 'Initialize Master Data (Run Once)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
