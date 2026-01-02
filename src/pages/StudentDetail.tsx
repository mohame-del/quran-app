import React, { useState, useEffect } from 'react';
import { ArrowRight, User, Phone, Mail, BookOpen, Star, Calendar, AlertTriangle, FileText, Trash2, Snowflake, Unlock } from 'lucide-react';
import { DashboardCharts } from '@/components/AdminCharts';

const StudentDetail = ({ studentId, onBack }: { studentId: string, onBack: () => void }) => {
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const res = await fetch(`/api/admin/students/${studentId}`);
                const data = await res.json();
                if (data.success) {
                    setStudent(data.student);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudent();
    }, [studentId]);

    const handleFreeze = async (e: React.MouseEvent) => {
        e.preventDefault();
        // Removed confirm for better UX/Testing - it's reversible
        try {
            const res = await fetch(`/api/admin/students/${student.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isFrozen: !student.isFrozen })
            });
            const data = await res.json();
            if (data.success) {
                setStudent((prev: any) => ({ ...prev, isFrozen: !prev.isFrozen }));
                // Optional: alert('تم التحديث');
            } else {
                alert('فشل التحديث');
            }
        } catch (e) {
            console.error(e);
            alert('حدث خطأ');
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!window.confirm('تحذير: سيتم حذف الطالب وجميع سجلاته (الحضور، التقييمات) نهائياً. هل أنت متأكد؟')) return;
        try {
            const res = await fetch(`/api/admin/students/${student.id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                alert('تم حذف الطالب بنجاح');
                onBack();
            } else {
                alert('فشل الحذف');
            }
        } catch (e) {
            console.error(e);
            alert('حدث خطأ أثناء الحذف');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!student) return <div className="text-white text-center py-20">لم يتم العثور على الطالب</div>;

    const performanceData = student.weeklyEvaluations.map((w: any) => ({
        name: new Date(w.weekStartDate).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
        points: w.totalPoints,
        rating: w.rating
    }));

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={onBack}
                        className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <ArrowRight size={20} />
                    </button>
                    <div>
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            {student.firstName} {student.lastName}
                            {student.isFrozen && <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded-full border border-red-500/20">مجمد</span>}
                        </h2>
                        <div className="flex items-center gap-4 text-slate-400 mt-1 text-sm">
                            <span className="flex items-center gap-1"><User size={14} /> ID: {student.id.substring(0, 8)}</span>
                            <span className="flex items-center gap-1"><BookOpen size={14} /> {student.school?.schoolName}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleFreeze}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all ${student.isFrozen ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'}`}
                    >
                        {student.isFrozen ? <Unlock size={18} /> : <Snowflake size={18} />}
                        {student.isFrozen ? 'إلغاء التجميد' : 'تجميد الحساب'}
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg flex items-center gap-2 font-bold transition-all"
                    >
                        <Trash2 size={18} />
                        حذف الطالب
                    </button>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Contact Info */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Phone size={18} className="text-emerald-400" /> معلومات الاتصال
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-lg">
                            <span className="text-slate-500 text-sm">هاتف الطالب</span>
                            <span className="text-slate-300 font-mono" dir="ltr">{student.phone || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-lg">
                            <span className="text-slate-500 text-sm">هاتف ولي الأمر</span>
                            <span className="text-slate-300 font-mono" dir="ltr">{student.parentPhone}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-lg">
                            <span className="text-slate-500 text-sm">البريد الإلكتروني</span>
                            <span className="text-slate-300 font-mono text-xs" dir="ltr">{student.parentEmail || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Progress Info */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Star size={18} className="text-amber-400" /> التقدم الأكاديمي
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950/50 p-4 rounded-xl text-center">
                            <div className="text-slate-500 text-xs mb-1">الحزب الحالي</div>
                            <div className="text-2xl font-bold text-emerald-400">{student.currentHizb}</div>
                        </div>
                        <div className="bg-slate-950/50 p-4 rounded-xl text-center">
                            <div className="text-slate-500 text-xs mb-1">الربع</div>
                            <div className="text-2xl font-bold text-emerald-400">{student.currentQuarter}</div>
                        </div>
                        <div className="bg-slate-950/50 p-4 rounded-xl text-center">
                            <div className="text-slate-500 text-xs mb-1">النقاط هذا الأسبوع</div>
                            <div className="text-2xl font-bold text-amber-400">{student.weeklyPoints}</div>
                        </div>
                        <div className="bg-slate-950/50 p-4 rounded-xl text-center">
                            <div className="text-slate-500 text-xs mb-1">النجوم</div>
                            <div className="text-2xl font-bold text-yellow-400">{student.currentStars}</div>
                        </div>
                    </div>
                </div>

                {/* Notes & Deductions */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-rose-400" /> الملاحظات والخصومات
                    </h3>
                    <div className="space-y-3 h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {student.notes.length === 0 && student.deductions.length === 0 && (
                            <div className="text-center text-slate-600 text-sm py-8">لا توجد ملاحظات أو خصومات</div>
                        )}
                        {student.notes.map((n: any) => (
                            <div key={n.id} className="bg-amber-500/10 border-r-2 border-amber-500 p-3 rounded text-sm text-slate-300">
                                <FileText size={14} className="inline mb-1 ml-1 text-amber-500" /> {n.content}
                            </div>
                        ))}
                        {student.deductions.map((d: any) => (
                            <div key={d.id} className="bg-rose-500/10 border-r-2 border-rose-500 p-3 rounded text-sm text-slate-300">
                                <div className="flex justify-between">
                                    <span>{d.reason}</span>
                                    <span className="text-rose-400 font-bold">-{d.points}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-80">
                <h3 className="text-lg font-bold text-white mb-6">تطور أداء الطالب</h3>
                <DashboardCharts.TrendLine data={performanceData} dataKey="points" name="النقاط" color="#10b981" />
            </div>

            {/* Attendance Grid */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6">سجل الحضور</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {student.attendance.map((a: any) => (
                        <div key={a.id} className={`p-3 rounded-xl border flex flex-col items-center justify-center ${a.status === 'PRESENT' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                            <span className="text-xs text-slate-400 mb-1">{new Date(a.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</span>
                            <span className={`font-bold ${a.status === 'PRESENT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {a.status === 'PRESENT' ? 'حاضر' : 'غائب'}
                            </span>
                        </div>
                    ))}
                    {student.attendance.length === 0 && <div className="col-span-full text-center text-slate-500">لا يوجد سجل حضور</div>}
                </div>
            </div>
        </div>
    );
};

export default StudentDetail;
