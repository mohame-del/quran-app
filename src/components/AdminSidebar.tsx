import React from 'react';
import {
    BarChart2,
    Users,
    Settings,
    LogOut,
    LayoutDashboard,
    School,
    AlertTriangle,
    GraduationCap
} from 'lucide-react';

interface SidebarProps {
    currentView: string;
    onChangeView: (view: string) => void;
    onLogout: () => void;
}

export const AdminSidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout }) => {
    const menuItems = [
        { id: 'index', label: 'نظرة عامة', icon: LayoutDashboard },
        { id: 'analytics', label: 'التحليلات والمؤشرات', icon: BarChart2 },
        { id: 'schools', label: 'المدارس', icon: School },
        { id: 'students', label: 'الطلاب', icon: Users },
        { id: 'teachers', label: 'الأساتذة', icon: GraduationCap },
        { id: 'risk', label: 'تحليل المخاطر', icon: AlertTriangle },
        { id: 'settings', label: 'الإعدادات', icon: Settings },
    ];

    return (
        <div className="w-64 bg-slate-900 border-l border-slate-800 flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-center">
                <h1 className="text-xl font-bold text-white tracking-wider">
                    <span className="text-emerald-500">AL-RAYAN</span> ADMIN
                </h1>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onChangeView(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
                ${isActive
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} className={isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-white'} />
                            <span className="font-medium">{item.label}</span>
                            {isActive && (
                                <div className="mr-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 rounded-lg transition-colors"
                >
                    <LogOut size={18} />
                    <span>تسجيل الخروج</span>
                </button>
            </div>
        </div>
    );
};
