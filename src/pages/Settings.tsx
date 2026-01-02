import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const Settings = () => {
    const { getCredentials, updateCredentials, logout } = useAdminAuth();
    const [formData, setFormData] = useState({ email: '', phone: '', password: '' });
    const [msg, setMsg] = useState('');

    useEffect(() => {
        setFormData(getCredentials());
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        if (!formData.email || !formData.phone || !formData.password) {
            setMsg('❌ جميع الحقول مطلوبة');
            return;
        }
        updateCredentials(formData);
        setMsg('✅ تم حفظ الإعدادات بنجاح');
        setTimeout(() => setMsg(''), 3000);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">إعدادات المدير</h2>
                <p className="text-slate-400">تحكم في بوابة الدخول السرية وبيانات الحساب</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 max-w-2xl">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">البريد الإلكتروني للإدارة</label>
                        <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">رقم الهاتف السري</label>
                        <input
                            name="phone"
                            type="text"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">كلمة المرور المشفرة</label>
                        <input
                            name="password"
                            type="text" // Shown as text because admin wants to manage it, or password if preferred. User wants "Able to change".
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono tracking-wider"
                        />
                    </div>

                    {msg && <div className={`p-4 rounded-xl text-center font-bold ${msg.includes('✅') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{msg}</div>}

                    <div className="pt-4 flex gap-4">
                        <button
                            onClick={handleSave}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        >
                            حفظ التغييرات
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-rose-900/10 border border-rose-500/20 rounded-2xl p-8 max-w-2xl">
                <h3 className="text-xl font-bold text-rose-400 mb-4">منطقة الخطر</h3>
                <p className="text-slate-400 mb-6">تسجيل الخروج من لوحة التحكم سيطلب منك إعادة إدخال البيانات السرية مرة أخرى.</p>
                <button
                    onClick={logout}
                    className="bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-600/30 font-bold py-3 px-6 rounded-xl transition-all"
                >
                    إنهاء الجلسة الآمنة
                </button>
            </div>
        </div>
    );
};

export default Settings;
