import React from 'react';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
    children: React.ReactNode;
    currentView: string;
    onChangeView: (view: string) => void;
    onLogout: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentView, onChangeView, onLogout }) => {
    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden" dir="rtl">
            {/* Sidebar */}
            <AdminSidebar currentView={currentView} onChangeView={onChangeView} onLogout={onLogout} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-950/50 relative">
                {/* Decorative Background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/5 rounded-full blur-[100px]" />
                </div>

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto p-8 relative z-10 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    {children}
                </main>
            </div>
        </div>
    );
};
