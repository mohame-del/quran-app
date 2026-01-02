'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Users, BookOpen, User, Search, X, LogOut, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import SectionSwitcher from './SectionSwitcher'


export default function Navbar() {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout, currentSectionId, sections, activeSection } = useAuth()
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [filteredStudents, setFilteredStudents] = useState<any[]>([])
    const [students, setStudents] = useState<any[]>([])
    const [showSchool, setShowSchool] = useState(false)

    const { theme, setTheme } = useTheme()

    const [sectionModal, setSectionModal] = useState<{ isOpen: boolean; mode: 'switch' | 'create' }>({
        isOpen: false,
        mode: 'switch'
    })

    const isActive = (path: string) => pathname === path

    useEffect(() => {
        if (user) {
            // Search students
            fetch('/api/students')
                .then(res => res.json())
                .then(data => {
                    if (data.success) setStudents(data.students)
                })
        }
    }, [user])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value
        setSearchQuery(query)

        if (query.trim()) {
            const filtered = students.filter(student =>
                `${student.firstName} ${student.lastName}`.toLowerCase().includes(query.toLowerCase())
            )
            setFilteredStudents(filtered)
        } else {
            setFilteredStudents([])
        }
    }

    const handleStudentSelect = (studentId: string) => {
        router.push(`/student/${studentId}`)
        setSearchOpen(false)
        setSearchQuery('')
        setFilteredStudents([])
    }

    if (!user) return null



    return (
        <>
            <nav className="fixed top-0 w-full bg-white dark:bg-gray-900 shadow-lg z-50 border-b-2 border-green-100 dark:border-gray-800 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-reverse space-x-4">
                            <h1 className="text-xl font-bold text-green-800 dark:text-green-300">تطبيق الريّان</h1>
                            {activeSection && (
                                <div className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-xs font-bold border border-green-200 dark:border-green-800 animate-pulse">
                                    قسم: {activeSection.name}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-reverse space-x-6">
                            <Link href="/" className={`flex items-center space-x-reverse space-x-2 px-3 py-2 rounded-lg transition-colors ${isActive('/') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'text-gray-600 dark:text-gray-300 hover:text-green-800 dark:hover:text-green-400'}`}>
                                <Home size={20} />
                                <span>الرئيسية</span>
                            </Link>

                            <Link href="/students" className={`flex items-center space-x-reverse space-x-2 px-3 py-2 rounded-lg transition-colors ${isActive('/students') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'text-gray-600 dark:text-gray-300 hover:text-green-800 dark:hover:text-green-400'}`}>
                                <Users size={20} />
                                <span>الطلبة</span>
                            </Link>

                            <Link href="/evaluation" className={`flex items-center space-x-reverse space-x-2 px-3 py-2 rounded-lg transition-colors ${isActive('/evaluation') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'text-gray-600 dark:text-gray-300 hover:text-green-800 dark:hover:text-green-400'}`}>
                                <BookOpen size={20} />
                                <span>التقييم</span>
                            </Link>

                            <div className="relative flex items-center gap-2">
                                {/* Dark Mode Toggle */}
                                <button
                                    onClick={() => setTheme(theme === 'dark' ? 'default' : 'dark')}
                                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    title="تبديل الوضع الداكن"
                                >
                                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                                </button>

                                <button className={`flex items-center space-x-reverse space-x-2 px-3 py-2 rounded-lg transition-colors ${isActive('/my-school') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'text-gray-600 dark:text-gray-300 hover:text-green-800 dark:hover:text-green-400'}`} onClick={() => setShowSchool(!showSchool)}>
                                    <User size={20} />
                                    <span>{activeSection?.name || 'مدرستي'}</span>
                                </button>

                                {showSchool && (
                                    <div className="absolute top-full mt-2 right-0 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
                                        <div className="text-right">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">المدرسة</div>
                                            <div className="font-semibold text-gray-900 dark:text-white">{user?.schoolName || 'مدرسة الريان'}</div>
                                            <div className="text-xs text-gray-400 mt-1">المستخدم: {user?.name || '—'}</div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 gap-2">
                                            <button onClick={() => { setShowSchool(false); router.push('/my-school') }} className="w-full text-right px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
                                                عرض تفاصيل المدرسة
                                            </button>

                                            <div className="my-2 border-t border-gray-100 dark:border-gray-700"></div>

                                            <button
                                                onClick={() => { setShowSchool(false); setSectionModal({ isOpen: true, mode: 'create' }) }}
                                                className="w-full text-right px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                            >
                                                إنشاء قسم
                                            </button>
                                            <button
                                                onClick={() => { setShowSchool(false); setSectionModal({ isOpen: true, mode: 'switch' }) }}
                                                className="w-full text-right px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                            >
                                                تبديل القسم
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                {!searchOpen ? (
                                    <button onClick={() => setSearchOpen(true)} className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                        <Search size={16} className="ml-2" />
                                        <span className="text-sm">بحث...</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center bg-white dark:bg-gray-900 border-2 border-green-500 rounded-full px-4 py-2 min-w-[300px]">
                                        <Search size={16} className="text-green-600 ml-2" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                            placeholder="اكتب اسم الطالب..."
                                            className="flex-1 outline-none text-sm bg-transparent text-gray-800 dark:text-white"
                                            autoFocus
                                        />
                                        <button onClick={() => { setSearchOpen(false); setSearchQuery('') }} className="text-gray-400 hover:text-gray-600 mr-2">
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}

                                {searchOpen && filteredStudents.length > 0 && (
                                    <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                        {filteredStudents.map((student) => (
                                            <button
                                                key={student.id}
                                                onClick={() => handleStudentSelect(student.id)}
                                                className="w-full text-right px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                            >
                                                <span className="font-medium text-gray-800 dark:text-white">{student.firstName} {student.lastName}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button onClick={logout} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-full" title="تسجيل الخروج">
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <SectionSwitcher
                isOpen={sectionModal.isOpen}
                mode={sectionModal.mode}
                onClose={() => setSectionModal({ ...sectionModal, isOpen: false })}
                currentSchoolId={user?.schoolId || user?.id}
            />
        </>
    )
}
