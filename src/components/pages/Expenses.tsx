import { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, Plus,
  Users, FileText, CheckCircle, AlertCircle, Trash2, ChevronDown, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ExpenseService } from '../../services/expenseService';
import { SalesService } from '../../services/salesService';
import { PaymentService } from '../../services/paymentService';

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
  salary: number;
}

export function Expenses({ theme }: { theme: 'light' | 'dark' }) {
  const isDark = theme === 'dark';

  // --- STATE ---
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Financials
  const [totalSalesIncome, setTotalSalesIncome] = useState(0);
  const [totalRechargeIncome, setTotalRechargeIncome] = useState(0);
  const [totalPurchaseCost, setTotalPurchaseCost] = useState(0);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [expenseForm, setExpenseForm] = useState({ category: 'Rent', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [salaryForm, setSalaryForm] = useState({ employeeId: '', otHours: 0, otRate: 100 });

  // --- 1. FETCH REAL DATA ---
  useEffect(() => {
    setLoading(true);

    const fetchData = async () => {
      try {
        // Fetch all data using services
        const [expensesData, salesData, paymentsData] = await Promise.all([
          ExpenseService.getExpenses(parseInt(currentMonth.split('-')[1]), parseInt(currentMonth.split('-')[0])),
          SalesService.getSales(),
          PaymentService.getPayments()
        ]);

        // Set expenses
        setExpenses(expensesData as any);

        // Calculate sales income for current month
        const salesIncome = salesData
          .filter((sale: any) => sale.date && sale.date.includes(currentMonth))
          .reduce((sum: number, sale: any) => sum + Number(sale.total_amount || 0), 0);
        setTotalSalesIncome(salesIncome);

        // Calculate recharge income for current month
        const rechargeIncome = paymentsData
          .filter((p: any) => p.paidDate && p.paidDate.includes(currentMonth) && p.status === 'Paid')
          .reduce((sum: number, p: any) => sum + Number(p.billAmount || 0), 0);
        setTotalRechargeIncome(rechargeIncome);

        // TODO: Calculate purchase cost when purchases API is ready
        setTotalPurchaseCost(0);

        // Employees placeholder (TODO: Create employees API)
        setEmployees([]);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching expense data:', error);
        setLoading(false);
      }
    };

    fetchData();

    // Poll every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [currentMonth]);



  // --- CALCULATIONS ---
  const totalIncome = totalSalesIncome + totalRechargeIncome;
  const totalExpenseValue = expenses.reduce((sum, item) => sum + Number(item.amount), 0) + totalPurchaseCost;
  const netProfit = totalIncome - totalExpenseValue;
  const isProfit = netProfit >= 0;

  // --- HANDLERS ---
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.description) return toast.error("Please fill all details");

    try {
      await ExpenseService.addExpense({
        category: expenseForm.category,
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description,
        date: expenseForm.date
      });
      toast.success("Expense Added!");
      setExpenseForm({ ...expenseForm, amount: '', description: '' });
    } catch (err) {
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
        await ExpenseService.addExpense({
          category: 'Salary',
          amount: totalPay,
          description: `Salary: ${employee.name} (${employee.role}) [Base: ${employee.salary} + OT: ${otAmount}]`,
          date: new Date().toISOString().split('T')[0]
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
      await ExpenseService.deleteExpense(id);
      toast.success("Record deleted");
    }
  };

  // --- CUSTOM SELECT COMPONENT ---
  const CustomSelect = ({ label, value, onChange, options, placeholder = "Select..." }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find((opt: any) => opt.value === value)?.label || value;

    return (
      <div className="relative" ref={dropdownRef}>
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">{label}</label>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-2.5 rounded-lg border text-sm font-medium flex items-center justify-between cursor-pointer transition-all ${isDark ? 'bg-[#0f172a] border-slate-700 text-slate-200' : 'bg-white border-gray-200 text-gray-900'
            }`}
        >
          <span>{selectedLabel || placeholder}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} text-gray-500`} />
        </div>

        {isOpen && (
          <div className={`absolute z-50 w-full mt-1 rounded-lg border shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100 ${isDark ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-200'
            }`}>
            {options.map((opt: any, idx: number) => (
              <div
                key={idx}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors ${value === opt.value
                    ? (isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600')
                    : (isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-50')
                  }`}
              >
                <span>{opt.label}</span>
                {value === opt.value && <Check className="w-4 h-4" />}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // --- STYLES ---
  const cardClass = `p-6 rounded-xl border ${isDark ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`;
  const inputClass = `w-full px-4 py-2.5 rounded-lg border outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDark
      ? 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'
      : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
    }`;

  const categoryOptions = [
    { value: 'Rent', label: 'Rent' },
    { value: 'EB Bill', label: 'EB Bill' },
    { value: 'Snacks', label: 'Snacks' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Other', label: 'Other' }
  ];

  const employeeOptions = employees.map(emp => ({ value: emp.id, label: `${emp.name} (${emp.role})` }));

  return (
    <div className={`p-6 min-h-screen font-sans ${isDark ? 'bg-[#1a1f2c] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>

      {/* Scrollbar Style */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDark ? '#475569' : '#94a3b8'}; }
      `}</style>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <TrendingUp className={`w-8 h-8 ${isProfit ? 'text-green-500' : 'text-red-500'}`} />
            Profit & Loss Management
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Track income, expenses, salaries, and net profit.</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isDark ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-200'}`}>
          <Calendar className="w-5 h-5 text-gray-500" />
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className={`bg-transparent outline-none text-sm font-bold w-32 ${isDark ? 'text-white' : 'text-gray-900'}`}
          />
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Income Card */}
        <div className={`${cardClass} relative overflow-hidden group`}>
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingUp className="w-24 h-24 text-green-500" /></div>
          <p className="text-sm font-medium text-gray-500 mb-1">Total Income</p>
          <h2 className="text-3xl font-bold text-green-500">₹{totalIncome.toLocaleString()}</h2>
          <div className="flex flex-col mt-2 text-xs text-gray-400 gap-1">
            <span>Sales: ₹{totalSalesIncome.toLocaleString()}</span>
            <span>Recharges: ₹{totalRechargeIncome.toLocaleString()}</span>
          </div>
        </div>

        {/* Expense Card */}
        <div className={`${cardClass} relative overflow-hidden group`}>
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingDown className="w-24 h-24 text-red-500" /></div>
          <p className="text-sm font-medium text-gray-500 mb-1">Total Expenses</p>
          <h2 className="text-3xl font-bold text-red-500">₹{totalExpenseValue.toLocaleString()}</h2>
          <div className="flex flex-col mt-2 text-xs text-gray-400 gap-1">
            <span>Purchases: ₹{totalPurchaseCost.toLocaleString()}</span>
            <span>Operational: ₹{(totalExpenseValue - totalPurchaseCost).toLocaleString()}</span>
          </div>
        </div>

        {/* Profit Card */}
        <div className={`${cardClass} relative overflow-hidden group`}>
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign className={`w-24 h-24 ${isProfit ? 'text-blue-500' : 'text-orange-500'}`} /></div>
          <p className="text-sm font-medium text-gray-500 mb-1">Net Profit / Loss</p>
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
        <TabsList className={`p-1 rounded-xl border ${isDark ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-200'}`}>
          <TabsTrigger value="overview" className="px-6 py-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">Overview & History</TabsTrigger>
          <TabsTrigger value="add-expense" className="px-6 py-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">Add Expense</TabsTrigger>
          <TabsTrigger value="payroll" className="px-6 py-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">Employee Payroll</TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW TABLE */}
        <TabsContent value="overview">
          <div className={`${cardClass} p-0 overflow-hidden flex flex-col`} style={{ maxHeight: '600px' }}>
            <div className={`p-4 border-b ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50/50'} flex justify-between items-center`}>
              <h3 className="font-bold flex items-center gap-2"><FileText className="w-4 h-4" /> Expense History</h3>
              <span className={`text-xs font-mono px-2 py-1 rounded ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>{expenses.length} Records</span>
            </div>

            <div className="overflow-auto custom-scrollbar flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className={`sticky top-0 z-10 uppercase text-xs font-bold ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
                  {expenses.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No expenses recorded for {currentMonth}</td></tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-50'}`}>
                        <td className={`px-6 py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{exp.date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium border
                                            ${exp.category === 'Salary' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                              exp.category === 'Rent' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                            {exp.category}
                          </span>
                        </td>
                        <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{exp.description}</td>
                        <td className="px-6 py-4 text-right font-bold text-red-500">-₹{exp.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => handleDelete(exp.id)} className="text-gray-400 hover:text-red-500 p-2 rounded hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Date</label>
                    <input type="date" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} className={inputClass} required />
                  </div>

                  {/* Custom Dropdown for Category */}
                  <CustomSelect
                    label="Category"
                    value={expenseForm.category}
                    onChange={(val: string) => setExpenseForm({ ...expenseForm, category: val })}
                    options={categoryOptions}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className={inputClass}
                    required
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Description</label>
                  <textarea rows={3} placeholder="Details about this expense..." value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} className={inputClass} required />
                </div>

                {/* BUTTON COLOR CHANGE based on TOGGLE */}
                <button
                  type="submit"
                  className={`w-full font-bold py-3 rounded-lg transition-all shadow-lg active:scale-95 ${isDark
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                    }`}
                >
                  Save Expense Record
                </button>
              </form>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: PAYROLL */}
        <TabsContent value="payroll">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Employee Selection & Form */}
            <div className={`${cardClass} lg:col-span-2`}>
              <h3 className="font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-purple-500" /> Process Salary</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Custom Dropdown for Employee Selection */}
                <div className="col-span-2 md:col-span-1">
                  <CustomSelect
                    label="Select Employee"
                    value={salaryForm.employeeId}
                    onChange={(val: string) => setSalaryForm({ ...salaryForm, employeeId: val })}
                    options={employeeOptions}
                    placeholder="-- Choose Employee --"
                  />
                </div>

                <div className="flex gap-2 col-span-2 md:col-span-1">
                  <div className="flex-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">OT Hours</label>
                    <input
                      type="number"
                      value={salaryForm.otHours}
                      onChange={e => setSalaryForm({ ...salaryForm, otHours: parseFloat(e.target.value) })}
                      className={inputClass}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">OT Rate</label>
                    <input
                      type="number"
                      value={salaryForm.otRate}
                      onChange={e => setSalaryForm({ ...salaryForm, otRate: parseFloat(e.target.value) })}
                      className={inputClass}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                </div>
              </div>

              {/* Salary Preview Box */}
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
                  <div className={`border-t border-dashed my-2 ${isDark ? 'border-slate-700' : 'border-gray-300'}`}></div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Payable</span>
                    <span className="text-green-500">
                      ₹{(employees.find(e => e.id === salaryForm.employeeId)?.salary || 0) + (salaryForm.otHours * salaryForm.otRate)}
                    </span>
                  </div>
                </div>
              )}

              {/* BUTTON COLOR CHANGE based on TOGGLE */}
              <button
                onClick={handleProcessSalary}
                disabled={!salaryForm.employeeId}
                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg
                    ${!salaryForm.employeeId
                    ? (isDark ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                    : (isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95')
                  }`}
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