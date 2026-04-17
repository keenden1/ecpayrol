import React from 'react';
import { FileText, Check, AlertCircle } from 'lucide-react';

const BenefitsStatusCards = ({ total, posted, pending }) => {
    const cards = [
        { icon: FileText,     label: 'Total Benefits',   value: total,   color: 'bg-indigo-500', top: 'bg-indigo-500'  },
        { icon: Check,        label: 'Posted Benefits',  value: posted,  color: 'bg-emerald-500', top: 'bg-emerald-500' },
        { icon: AlertCircle,  label: 'Pending Benefits', value: pending, color: 'bg-amber-500',   top: 'bg-amber-500'   },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {cards.map(({ icon: Icon, label, value, color, top }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className={`h-1 ${top}`} />
                    <div className="p-3 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                            <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BenefitsStatusCards;
