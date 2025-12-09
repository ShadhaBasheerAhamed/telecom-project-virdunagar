// ✅ FINAL — ConvertLeadModal.tsx with Dynamic Dropdown

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { MasterRecordService } from '@/services/masterRecordService';

interface ConvertLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { landline: string; plan: string; oltIp: string; ott: string }) => void;
    isLoading?: boolean;
    theme: 'light' | 'dark';
}

export function ConvertLeadModal({
    isOpen,
    onClose,
    onSubmit,
    isLoading = false,
    theme
}: ConvertLeadModalProps) {

    const isDark = theme === 'dark';

    // Form States
    const [landline, setLandline] = useState("");
    const [plan, setPlan] = useState("");
    const [oltIp, setOltIp] = useState("");
    const [ott, setOtt] = useState("");

    // Dynamic Dropdown States
    const [plans, setPlans] = useState<any[]>([]);
    const [oltIps, setOltIps] = useState<any[]>([]);
    const [otts, setOtts] = useState<any[]>([]);

    // Error State
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // -----------------------------------------------------
    // ✅ Load Master Records (Same as CustomerModal)
    // -----------------------------------------------------
    const loadMasterData = async () => {
        try {
            const [p, o, ot] = await Promise.all([
                MasterRecordService.getRecords("plan"),
                MasterRecordService.getRecords("oltIp"),
                MasterRecordService.getRecords("ott")
            ]);

            setPlans(p.filter((x: any) => x.status === "Active"));
            setOltIps(o.filter((x: any) => x.status === "Active"));
            setOtts(ot.filter((x: any) => x.status === "Active"));
        } catch (err) {
            console.error("Error loading dropdown data:", err);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadMasterData(); // Load plans, oltIp, ott dynamically
            setLandline("");
            setPlan("");
            setOltIp("");
            setOtt("");
            setErrors({});
        }
    }, [isOpen]);

    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------
    const validate = () => {
        const newErrors: any = {};

        if (!landline.trim()) newErrors.landline = "Landline is required";
        if (!plan.trim()) newErrors.plan = "Please select a Plan";
        if (!oltIp.trim()) newErrors.oltIp = "Please select OLT IP";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        onSubmit({
            landline,
            plan,
            oltIp,
            ott
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={`w-full max-w-md rounded-xl shadow-xl overflow-hidden 
                ${isDark ? "bg-slate-800 text-white border border-slate-700"
                        : "bg-white text-gray-900 border border-gray-200"}`}>

                {/* Header */}
                <div className={`px-6 py-4 flex justify-between items-center border-b 
                    ${isDark ? "border-slate-700" : "border-gray-200"}`}>
                    <h2 className="text-lg font-bold">Convert to Customer</h2>
                    <button onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">

                    {/* Landline */}
                    <div>
                        <label className="text-sm font-medium opacity-80">
                            Landline <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={landline}
                            onChange={(e) => setLandline(e.target.value)}
                            placeholder="Enter landline number"
                            className={`w-full px-3 py-2 rounded-lg border outline-none 
                                ${isDark ? "bg-slate-900 border-slate-600" : "bg-gray-50 border-gray-300"}
                                focus:ring-2 focus:ring-blue-500`}
                        />
                        {errors.landline && <p className="text-xs text-red-500">{errors.landline}</p>}
                    </div>

                    {/* Plan Dropdown */}
                    <div>
                        <label className="text-sm font-medium opacity-80">
                            Plan <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={plan}
                            onChange={(e) => setPlan(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border outline-none
                                ${isDark ? "bg-slate-900 border-slate-600" : "bg-gray-50 border-gray-300"}
                                focus:ring-2 focus:ring-blue-500`}
                        >
                            <option value="">Select Plan</option>
                            {plans.map((p) => (
                                <option key={p.id} value={p.name}>
                                    {p.name} - ₹{p.total}
                                </option>
                            ))}
                        </select>
                        {errors.plan && <p className="text-xs text-red-500">{errors.plan}</p>}
                    </div>

                    {/* OLT IP */}
                    <div>
                        <label className="text-sm font-medium opacity-80">
                            OLT IP <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={oltIp}
                            onChange={(e) => setOltIp(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border outline-none
                                ${isDark ? "bg-slate-900 border-slate-600" : "bg-gray-50 border-gray-300"}
                                focus:ring-2 focus:ring-blue-500`}
                        >
                            <option value="">Select OLT IP</option>
                            {oltIps.map((ip) => (
                                <option key={ip.id} value={ip.name}>
                                    {ip.name}
                                </option>
                            ))}
                        </select>
                        {errors.oltIp && <p className="text-xs text-red-500">{errors.oltIp}</p>}
                    </div>

{/* OTT Subscription */}
<div>
    <label className="text-sm font-medium opacity-80">OTT Subscription</label>
    <input
        type="text"
        value={ott}
        onChange={(e) => setOtt(e.target.value)}
        placeholder="Enter OTT Subscription"
        className={`w-full px-3 py-2 rounded-lg border outline-none 
            ${isDark ? "bg-slate-900 border-slate-600" : "bg-gray-50 border-gray-300"}
            focus:ring-2 focus:ring-blue-500`}
    />
</div>

                </div>

                {/* Footer */}
                <div className={`px-6 py-4 flex justify-end gap-3 border-t 
                    ${isDark ? "border-slate-700 bg-slate-800/50" : "border-gray-200 bg-gray-50"}`}>

                    <button onClick={onClose} className="px-4 py-2 rounded-lg">
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Submit / Convert
                    </button>
                </div>
            </div>
        </div>
    );
}
