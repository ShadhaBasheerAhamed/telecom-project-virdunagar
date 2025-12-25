import { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, Plus, 
  Users, Zap, FileText, CheckCircle, AlertCircle, Trash2 
} from 'lucide-react';
import { toast } from 'sonner';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// --- TYPES ---
interface ExpenseRecord {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string; 
  createdAt: any;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  salary: number; // Matches the field in Master Records
}

export function Expenses({ theme }: { theme: 'light' | 'dark' }) {
  const isDark = theme === 'dark';
  
  // --- STATE ---
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // Financials
  const [totalSalesIncome, setTotalSalesIncome] = useState(0);
  const [totalRechargeIncome, setTotalRechargeIncome] = useState(0);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]); // ✅ Real Employees
  const [loading, setLoading] = useState(true);

  // Forms
  const [expenseForm, setExpenseForm] = useState({ category: 'Rent', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [salaryForm, setSalaryForm] = useState({ employeeId: '', otHours: 0, otRate: 100 }); 

  // --- 1. FETCH REAL DATA ---
  useEffect(() => {
    setLoading(true);
    
    // A. Fetch Employees from Master Records (Collection: 'employee')
    const fetchEmployees = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'employee')); // ✅ Fetching from 'employee' collection
            const empList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as any[];
            // Map fields if necessary (ensure salary exists)
            setEmployees(empList.map(e => ({
                id: e.id,
                name: e.name,
                role: e.role || 'Staff',
                salary: Number(e.salary) || 0 // Ensure number
            })));
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };
    fetchEmployees();

    // B. Real-time Listeners for Month Data
    const startOfMonth = `${currentMonth}-01`;
    const endOfMonth = `${currentMonth}-31`;

    // 1. Expenses
    const expenseQuery = query(
      collection(db, 'expenses'),
      where('date', '>=', startOfMonth),
      where('date', '<=', endOfMonth),
      orderBy('date', 'desc')
    );

    const unsubExpenses = onSnapshot(expenseQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpenseRecord));
      setExpenses(data);
    }, (err) => console.log("Expense permission/index error:", err));

    // 2. Sales Income (Calculated locally for simplicity)
    const unsubSales = onSnapshot(query(collection(db, 'sales')), (snapshot) => {
      let total = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Check date match (Supports YYYY-MM-DD)
        if (data.date && String(data.date).includes(currentMonth)) {
            total += Number(data.totalAmount) || 0;
        }
      });
      setTotalSalesIncome(total);
    });

    // 3. Recharge Income (Payments)
    const unsubPayments = onSnapshot(query(collection(db, 'payments')), (snapshot) => {
      let total = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Check date match
        if (data.paidDate && String(data.paidDate).includes(currentMonth) && data.status === 'Paid') {
             total += Number(data.billAmount) || 0;
        }
      });
      setTotalRechargeIncome(total);
      setLoading(false);
    });

    return () => {
      unsubExpenses();
      unsubSales();
      unsubPayments();
    };
  }, [currentMonth]);

  // --- CALCULATIONS ---
  const totalIncome = totalSalesIncome + totalRechargeIncome;
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const netProfit = totalIncome - totalExpenses;
  const isProfit = netProfit >= 0;

  // --- HANDLERS ---
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.description) return toast.error("Please fill all details");

    try {
      // ✅ Creates 'expenses' collection if not exists
      await addDoc(collection(db, 'expenses'), {
        category: expenseForm.category,
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description,
        date: expenseForm.date,
        createdAt: Timestamp.now()
      });
      toast.success("Expense Added!");
      setExpenseForm({ ...expenseForm, amount: '', description: '' });
    } catch (err) {
      console.error(err);
      toast.error("Failed to add expense");
    }
  };

  const handleProcessSalary = async () => {
    if (!salaryForm.employeeId) return toast.error("Select an employee");
    
    const employee = employees.find(e => e.id === salaryForm.employeeId);
    if (!employee) return;

    if (employee.salary <= 0) return toast.error("Update Basic Salary in Master Records first");

    const otAmount = salaryForm.otHours * salaryForm.otRate;
    const totalPay = employee.salary + otAmount;

    if (confirm(`Process Salary for ${employee.name}?\nBase: ₹${employee.salary}\nOT: ₹${otAmount}\nTotal: ₹${totalPay}`)) {
      try {
        await addDoc(collection(db, 'expenses'), {
          category: 'Salary',
          amount: totalPay,
          description: `Salary: ${employee.name} (${employee.role}) [Base: ${employee.salary} + OT: ${otAmount}]`,
          date: new Date().toISOString().split('T')[0],
          createdAt: Timestamp.now()
        });
        toast.success(`Salary Recorded: ₹${totalPay}`);
        setSalaryForm({ employeeId: '', otHours: 0, otRate: 100 });
      } catch (err) {
        toast.error("Error processing salary");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this expense record?')) {
      await deleteDoc(doc(db, 'expenses', id));
      toast.success("Record deleted");
    }
  };

  // --- STYLES ---
  const cardClass = `p-6 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-100 shadow-sm'}`;
  const inputClass = `w-full px-4 py-2.5 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:ring-2 focus:ring-blue-500 outline-none`;

  return (
    <div className={`p-6 min-h-screen ${isDark ? 'bg-[#1a1f2c] text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TrendingUp className={`w-8 h-8 ${isProfit ? 'text-green-500' : 'text-red-500'}`} /> 
            Profit & Loss Management
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Track income, expenses, salaries, and net profit.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg border border-gray-200 dark:border-slate-700">
          <Calendar className="w-5 h-5 text-gray-500" />
          <input 
            type="month" 
            value={currentMonth} 
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="bg-transparent outline-none text-sm font-bold w-32"
          />
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`${cardClass} relative overflow-hidden group`}>
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingUp className="w-24 h-24 text-green-500" /></div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Income</p>
          <h2 className="text-3xl font-bold text-green-500">₹{totalIncome.toLocaleString()}</h2>
          <div className="flex gap-4 mt-2 text-xs text-gray-400">
            <span>Sales: ₹{totalSalesIncome}</span>
            <span>Recharges: ₹{totalRechargeIncome}</span>
          </div>
        </div>

        <div className={`${cardClass} relative overflow-hidden group`}>
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingDown className="w-24 h-24 text-red-500" /></div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Expenses</p>
          <h2 className="text-3xl font-bold text-red-500">₹{totalExpenses.toLocaleString()}</h2>
          <p className="text-xs text-gray-400 mt-2">{expenses.length} transactions this month</p>
        </div>

        <div className={`${cardClass} relative overflow-hidden group`}>
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign className={`w-24 h-24 ${isProfit ? 'text-blue-500' : 'text-orange-500'}`} /></div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Net Profit / Loss</p>
          <h2 className={`text-3xl font-bold ${isProfit ? 'text-blue-500' : 'text-orange-500'}`}>
            {isProfit ? '+' : ''}₹{netProfit.toLocaleString()}
          </h2>
          <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded font-medium ${isProfit ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
            {isProfit ? 'Profit Margin' : 'Loss'}
          </span>
        </div>
      </div>

      {/* MAIN CONTENT TABS */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className={`p-1 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <TabsTrigger value="overview" className="px-6 py-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">Overview & History</TabsTrigger>
          <TabsTrigger value="add-expense" className="px-6 py-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">Add Expense</TabsTrigger>
          <TabsTrigger value="payroll" className="px-6 py-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">Employee Payroll</TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW TABLE */}
        <TabsContent value="overview">
          <div className={`${cardClass} p-0 overflow-hidden`}>
             <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                 <h3 className="font-bold flex items-center gap-2"><FileText className="w-4 h-4" /> Expense History</h3>
                 <span className="text-xs font-mono bg-gray-200 dark:bg-slate-700 px-2 py-1 rounded">{expenses.length} Records</span>
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                     <thead className="bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-gray-400 uppercase text-xs">
                         <tr>
                             <th className="px-6 py-3">Date</th>
                             <th className="px-6 py-3">Category</th>
                             <th className="px-6 py-3">Description</th>
                             <th className="px-6 py-3 text-right">Amount</th>
                             <th className="px-6 py-3 text-center">Action</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                         {expenses.length === 0 ? (
                             <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No expenses recorded for {currentMonth}</td></tr>
                         ) : (
                             expenses.map((exp) => (
                                 <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                     <td className="px-6 py-3 text-gray-500">{exp.date}</td>
                                     <td className="px-6 py-3">
                                         <span className={`px-2 py-1 rounded-md text-xs font-medium border
                                            ${exp.category === 'Salary' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' : 
                                              exp.category === 'Rent' ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' :
                                              'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700'}`}>
                                            {exp.category}
                                         </span>
                                     </td>
                                     <td className="px-6 py-3 font-medium">{exp.description}</td>
                                     <td className="px-6 py-3 text-right font-bold text-red-500">-₹{exp.amount.toLocaleString()}</td>
                                     <td className="px-6 py-3 text-center">
                                         <button onClick={() => handleDelete(exp.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                     </td>
                                 </tr>
                             ))
                         )}
                     </tbody>
                 </table>
             </div>
          </div>
        </TabsContent>

        {/* TAB 2: ADD EXPENSE FORM */}
        <TabsContent value="add-expense">
          <div className="max-w-2xl mx-auto">
             <div className={cardClass}>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-500" /> Add New Expense</h3>
                <form onSubmit={handleAddExpense} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Date</label>
                            <input type="date" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} className={inputClass} required />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Category</label>
                            <select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} className={inputClass}>
                                <option>Rent</option>
                                <option>EB Bill</option>
                                <option>Snacks</option>
                                <option>Maintenance</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Amount (₹)</label>
                        <input type="number" placeholder="0.00" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className={inputClass} required />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Description</label>
                        <textarea rows={3} placeholder="Details about this expense..." value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} className={inputClass} required />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                        Save Expense Record
                    </button>
                </form>
             </div>
          </div>
        </TabsContent>

        {/* TAB 3: PAYROLL */}
        <TabsContent value="payroll">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Employee List / Selection */}
             <div className={`${cardClass} lg:col-span-2`}>
                <h3 className="font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-purple-500" /> Process Salary</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Select Employee</label>
                        <select value={salaryForm.employeeId} onChange={e => setSalaryForm({...salaryForm, employeeId: e.target.value})} className={inputClass}>
                            <option value="">-- Choose Employee --</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 mb-1 block">OT Hours</label>
                            <input type="number" value={salaryForm.otHours} onChange={e => setSalaryForm({...salaryForm, otHours: parseFloat(e.target.value)})} className={inputClass} />
                        </div>
                        <div className="w-24">
                            <label className="text-xs font-bold text-gray-500 mb-1 block">OT Rate</label>
                            <input type="number" value={salaryForm.otRate} onChange={e => setSalaryForm({...salaryForm, otRate: parseFloat(e.target.value)})} className={inputClass} />
                        </div>
                    </div>
                </div>

                {/* Salary Preview */}
                {salaryForm.employeeId && (
                   <div className={`p-4 rounded-xl border mb-6 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-gray-500">Base Salary</span>
                         <span className="font-medium">₹{employees.find(e => e.id === salaryForm.employeeId)?.salary}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-gray-500">Overtime ({salaryForm.otHours}hrs x ₹{salaryForm.otRate})</span>
                         <span className="font-medium text-orange-500">+ ₹{salaryForm.otHours * salaryForm.otRate}</span>
                      </div>
                      <div className="border-t border-dashed border-gray-400 my-2"></div>
                      <div className="flex justify-between items-center text-lg font-bold">
                         <span>Total Payable</span>
                         <span className="text-green-500">
                            ₹{(employees.find(e => e.id === salaryForm.employeeId)?.salary || 0) + (salaryForm.otHours * salaryForm.otRate)}
                         </span>
                      </div>
                   </div>
                )}

                <button 
                  onClick={handleProcessSalary} 
                  disabled={!salaryForm.employeeId}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${!salaryForm.employeeId ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20'}`}
                >
                    <CheckCircle className="w-5 h-5" /> Confirm & Add to Expenses
                </button>
             </div>

             {/* Side Info */}
             <div className={cardClass}>
                <h4 className="font-bold text-sm mb-4">Quick Stats</h4>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500"><Users className="w-5 h-5" /></div>
                        <div>
                            <p className="text-2xl font-bold">{employees.length}</p>
                            <p className="text-xs text-gray-500">Active Employees</p>
                        </div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 mt-4">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        Salary will be added to Expense History automatically.
                    </div>
                </div>
             </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}