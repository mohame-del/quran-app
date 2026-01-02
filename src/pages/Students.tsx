import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, User, Smartphone, BookOpen } from 'lucide-react';
import { generateMockStudents } from '@/lib/mockData';

const Students = ({ onSelect }: { onSelect: (id: string) => void }) => {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await fetch('/api/admin/students');
                const data = await res.json();
                if (data.success) {
                    setStudents(data.students);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-white">إدارة الطلاب</h2>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute right-3 top-3 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="بحث عن طالب..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pr-10 pl-4 text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <button className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-slate-400 hover:text-white">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-slate-900 text-slate-400 text-sm font-medium">
                        <tr>
                            <th className="px-6 py-4">الطالب</th>
                            <th className="px-6 py-4">المدرسة</th>
                            <th className="px-6 py-4">المستوى</th>
                            <th className="px-6 py-4">ولي الأمر</th>
                            <th className="px-6 py-4">معدل الحضور</th>
                            <th className="px-6 py-4">النقاط</th>
                            <th className="px-6 py-4">الحالة</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                        {loading ? (
                            <tr><td colSpan={8} className="text-center py-8">جاري تحميل البيانات...</td></tr>
                        ) : students.length === 0 ? (
                            <tr><td colSpan={8} className="text-center py-8 text-slate-500">لا يوجد طلاب مسجلين</td></tr>
                        ) : students.map((student) => (
                            <tr
                                key={student.id}
                                className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                                onClick={() => onSelect(student.id)}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-emerald-500 font-bold border border-slate-700">
                                            {student.firstName[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{student.firstName} {student.lastName}</div>
                                            <div className="text-xs text-slate-500">ID: {student.id.substring(0, 6)}...</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <BookOpen size={14} />
                                        {student.schoolName}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-slate-800 px-2 py-1 rounded text-xs">{student.currentHizb || 0} حزب</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <Smartphone size={14} />
                                        {student.parentPhone}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="w-24 bg-slate-800 rounded-full h-1.5 mt-1">
                                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${student.attendanceRate}%` }}></div>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">{student.attendanceRate}%</div>
                                </td>
                                <td className="px-6 py-4 font-mono text-emerald-400">
                                    {student.weeklyPoints || 0}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs border ${student.isFrozen ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                        {student.isFrozen ? 'مجمد' : 'نشط'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button className="text-slate-500 hover:text-white transition-colors">
                                        <MoreHorizontal size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Students;
