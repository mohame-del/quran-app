import React, { useState, useEffect } from 'react';
import Index from './pages/Index';
import Analytics from './pages/Analytics';
import Schools from './pages/Schools';
import Students from './pages/Students';
import Settings from './pages/Settings';
import Teachers from './pages/Teachers';
import RiskAnalysis from './pages/RiskAnalysis';
import SchoolDetail from './pages/SchoolDetail';
import { AdminLayout } from './components/AdminLayout';
import { useAdminAuth } from './hooks/useAdminAuth';

// LoginForm Component
const LoginForm = ({ onLogin }: { onLogin: (email: string, phone: string, password: string) => boolean }) => {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const success = onLogin(email, phone, password);
        if (!success) {
            setError('❌ بيانات الدخول غير صحيحة');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-slate-400 text-sm mb-2 text-right">البريد الإلكتروني</label>
                <input
                    type="email"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none text-left"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-slate-400 text-sm mb-2 text-right">رقم الهاتف</label>
                <input
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none text-left"
                    placeholder="0770..."
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-slate-400 text-sm mb-2 text-right">كلمة المرور</label>
                <input
                    type="password"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none text-left"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                    {error}
                </div>
            )}

            <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
            >
                دخول آمن
            </button>
        </form>
    );
};

// This component acts as the Router for the Admin Dashboard
import StudentDetail from './pages/StudentDetail';

const App = () => {
    const { isAuthenticated, loading, logout, login } = useAdminAuth();
    const [view, setView] = useState('index');
    const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    const handleSchoolSelect = (id: string) => {
        setSelectedSchoolId(id);
        setView('school-detail');
    };

    const handleStudentSelect = (id: string) => {
        setSelectedStudentId(id);
        setView('student-detail');
    };

    // Simple router
    const renderView = () => {
        switch (view) {
            case 'index': return <Index />;
            case 'analytics': return <Analytics />;
            case 'schools': return <Schools onSelect={handleSchoolSelect} />;
            case 'school-detail': return <SchoolDetail schoolId={selectedSchoolId!} onBack={() => setView('schools')} />;
            case 'students': return <Students onSelect={handleStudentSelect} />;
            case 'student-detail': return <StudentDetail studentId={selectedStudentId!} onBack={() => setView('students')} />;
            case 'teachers': return <Teachers onSelect={handleSchoolSelect} />;
            case 'settings': return <Settings />;
            case 'risk': return <RiskAnalysis />;
            default: return <Index />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-fade-in">
                    <div className="mb-8 text-center">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🔒</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">البوابة السرية</h1>
                        <p className="text-slate-400 text-sm">أدخل بيانات التحقق للوصول إلى لوحة التحكم</p>
                    </div>

                    <LoginForm onLogin={(e, p, pass) => {
                        const success = login(e, p, pass);
                        if (!success) return false;
                        return true;
                    }} />
                </div>
            </div>
        );
    }

    return (
        <AdminLayout currentView={view} onChangeView={setView} onLogout={logout}>
            {renderView()}
        </AdminLayout>
    );
};

export default App;
