
import React, { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Section {
    id: string;
    name: string;
    sheikhName: string | null;
    studentsCount?: number;
}

interface Props {
    isOpen: boolean;
    mode: 'switch' | 'create';
    onClose: () => void;
    currentSchoolId?: string; // Optional, might come from context or props
}

export default function SectionSwitcher({ isOpen, mode, onClose, currentSchoolId }: Props) {
    const [loading, setLoading] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');
    const [sheikhName, setSheikhName] = useState('');
    const [sheikhEmail, setSheikhEmail] = useState('');
    const { setSection, currentSectionId: activeId, sections, refreshSections } = useAuth();
    const router = useRouter();

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSectionName.trim()) return;

        const sid = currentSchoolId;
        console.log('Creating section with schoolId:', sid); // Debug log

        if (!sid) {
            alert("حدث خطأ: لم يتم العثور على معرّف المدرسة. يرجى إعادة تسجيل الدخول.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: newSectionName,
                sheikhName,
                email: sheikhEmail,
                schoolId: sid
            };
            console.log('Sending section creation request:', payload); // Debug log

            const res = await fetch('/api/sections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            console.log('Section creation response:', data); // Debug log

            if (data.success) {
                // Clear form
                setNewSectionName('');
                setSheikhName('');
                setSheikhEmail('');

                // Sync sections list in context
                await refreshSections();

                // Auto-select the newly created section via context
                if (data.section?.id) {
                    setSection(data.section.id);
                }

                // Close and notify
                alert('تم إنشاء القسم بنجاح!');
                onClose();
                // Route to home as requested
                router.push('/');
            } else {
                alert(data.message || "فشل إنشاء القسم");
            }
        } catch (error) {
            console.error('Section creation error:', error);
            alert("حدث خطأ أثناء الاتصال بالخادم");
        } finally {
            setLoading(false);
        }
    };

    const handleSwitch = (sectionId: string) => {
        setSection(sectionId);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {mode === 'switch' ? 'تبديل القسم' : 'إنشاء قسم جديد'}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4">
                    {mode === 'switch' ? (
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            <button
                                onClick={() => handleSwitch('all')}
                                className={`w-full text-right p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-dashed flex justify-between items-center group transition-all mb-4 ${(!activeId || activeId === 'all')
                                    ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20'
                                    : 'border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                <div>
                                    <div className="font-bold text-green-600 dark:text-green-400 text-sm">عرض كل الأقسام</div>
                                </div>
                                <div className={`${(!activeId || activeId === 'all') ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} text-green-500`}>
                                    <Check size={16} />
                                </div>
                            </button>

                            {sections.length === 0 && !loading ? (
                                <div className="text-center py-8 text-gray-500">لا توجد أقسام خاصة حالياً</div>
                            ) : (
                                sections.map(section => (
                                    <button
                                        key={section.id}
                                        onClick={() => handleSwitch(section.id)}
                                        className={`w-full text-right p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 border flex justify-between items-center group transition-all ${activeId === section.id
                                            ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20'
                                            : 'border-gray-100 dark:border-gray-700'
                                            }`}
                                    >
                                        <div>
                                            <div className="font-semibold text-gray-800 dark:text-gray-200">{section.name}</div>
                                            <div className="text-xs text-gray-500">{section.sheikhName || 'بدون مسؤول'}</div>
                                        </div>
                                        <div className={`${activeId === section.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} text-green-500`}>
                                            <Check size={16} />
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم القسم</label>
                                <input
                                    required
                                    value={newSectionName}
                                    onChange={e => setNewSectionName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 outline-none"
                                    placeholder="مثال: قسم التحفيظ المكثف"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم الشيخ المسؤول</label>
                                <input
                                    value={sheikhName}
                                    onChange={e => setSheikhName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 outline-none"
                                    placeholder="الشيخ فلان..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">إيميل الشيخ</label>
                                <input
                                    type="email"
                                    value={sheikhEmail}
                                    onChange={e => setSheikhEmail(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 outline-none"
                                    placeholder="email@example.com"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-md transition-all flex justify-center items-center gap-2"
                            >
                                {loading ? 'جاري الإنشاء...' : (
                                    <>
                                        <Plus size={18} />
                                        إنشاء القسم
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
