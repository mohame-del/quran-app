import { useParams } from 'react-router-dom'
import { Star, Phone, BookOpen, Edit, Snowflake, Trash2, UserCheck, Minus, X } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useState, useEffect } from 'react'
import { getStudent, updateStudent, toggleStudentStatus, deleteStudent, deductPoints, deleteStudentNote } from '../firebase/firestore.js'
import { useNavigate } from 'react-router-dom'
import { formatAppDate } from '../utils/date.js'
import { normalizePeriod } from '../utils/helpers.js'

export default function StudentProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editingPhone, setEditingPhone] = useState(false)
  const [editingFatherPhone, setEditingFatherPhone] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDeductModal, setShowDeductModal] = useState(false)
  const [deductPointsValue, setDeductPointsValue] = useState(1)
  const [deductReason, setDeductReason] = useState('')
  const [activeTab, setActiveTab] = useState('weekly')

  useEffect(() => {
    const fetchStudent = async () => {
      const result = await getStudent(id)
      if (result.success) {
        const studentWithExtraData = {
          ...result.student,
          name: `${result.student.firstName} ${result.student.lastName}`,
          phone: result.student.phone || '',
          fatherPhone: result.student.fatherPhone || '',
          absences: 0,
          stars: result.student.stars || 0,
          rating: result.student.weeklyRating || 0,
          notes: result.student.notes || [],
          weeklyData: result.student.weeklyData || [],
          monthlyData: result.student.monthlyData || [],
          yearlyData: result.student.yearlyData || [],
          deductions: result.student.deductions || []
        }
        setStudent(studentWithExtraData)
      } else {
        setError(result.error)
      }
      setLoading(false)
    }
    
    fetchStudent()
  }, [id]) 

  const handleToggleFreeze = async () => {
    if (!student) return
    
    const result = await toggleStudentStatus(student.id, !student.isFrozen)
    if (result.success) {
      setStudent(prev => ({ ...prev, isFrozen: !prev.isFrozen }))
      alert(student.isFrozen ? 'تم إلغاء تجميد الطالب' : 'تم تجميد الطالب')
    } else {
      alert('حدث خطأ: ' + result.error)
    }
  }

  const handleDeleteStudent = async () => {
    if (!student) return
    
    const result = await deleteStudent(student.id)
    if (result.success) {
      alert('تم حذف الطالب بنجاح')
      navigate('/students')
    } else {
      alert('حدث خطأ في حذف الطالب: ' + result.error)
    }
    setShowDeleteModal(false)
  }

  const handleDeductPoints = async () => {
    if (!student || !deductReason.trim()) {
      alert('يرجى إدخال سبب الخصم')
      return
    }
    
    const result = await deductPoints(student.id, deductPointsValue, deductReason)
    if (result.success) {
      setStudent(prev => ({
        ...prev,
        weeklyPoints: result.weeklyPoints,
        dailyPoints: result.dailyPoints,
        deductions: [...(prev.deductions || []), {
          points: -deductPointsValue,
          reason: deductReason,
          date: new Date(),
          timestamp: new Date()
        }]
      }))
      alert(`تم خصم ${deductPointsValue} نقاط بنجاح`)
      setShowDeductModal(false)
      setDeductPointsValue(1)
      setDeductReason('')
    } else {
      alert('حدث خطأ في خصم النقاط: ' + result.error)
    }
  }

  const handleDeleteNote = async (noteId) => {
    if (!student) return
    
    const result = await deleteStudentNote(student.id, noteId)
    if (result.success) {
      setStudent(prev => ({ ...prev, notes: result.notes }))
      alert('تم حذف الملاحظة بنجاح')
    } else {
      alert('حدث خطأ في حذف الملاحظة: ' + result.error)
    }
  }

  const getChartData = () => {
    if (!student) return []


    const hasAttendance = (dateStr, target) => {
      return (student.attendanceHistory || []).some(r => r.date === dateStr && normalizePeriod(r.period) === target)
    }
    const hasPresentation = (dateStr) => {
      return (student.presentationHistory || []).some(r => r.date === dateStr)
    }
    const formatDateKey = (d) => d.toISOString().split('T')[0]

    const today = new Date()

    switch (activeTab) {
      case 'weekly': {
        // Build week Sat..Thu (no Friday)
        const day = today.getDay() // 0 Sun .. 6 Sat
        const lastSaturday = new Date(today)
        const deltaToSaturday = (day + 1) % 7 // if Sat(6)->0, Sun(0)->1 ...
        lastSaturday.setDate(today.getDate() - deltaToSaturday)
        const days = []
        for (let i = 0; i < 6; i++) { // Sat..Thu
          const d = new Date(lastSaturday)
          d.setDate(lastSaturday.getDate() + i)
          days.push(d)
        }
        let cumulative = 0
        const data = days.map((d, idx) => {
          const key = formatDateKey(d)
          const pointsToday = (hasAttendance(key, 'morning') ? 1 : 0) + (hasAttendance(key, 'evening') ? 1 : 0) + (hasPresentation(key) ? 1 : 0)
          cumulative += pointsToday
          // x labels: names Sat..Thu in Arabic
          const weekDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
          return { day: weekDays[idx], points: cumulative }
        })
        return data
      }
      case 'monthly': {
        // 4 buckets (days 1-7, 8-14, 15-21, 22-end). Each bucket total capped by 15 → scale to 0..10
        const month = today.getMonth()
        const year = today.getFullYear()
        const endOfMonth = new Date(year, month + 1, 0).getDate()
        const buckets = [0, 0, 0, 0]
        // Iterate attendance
        ;(student.attendanceHistory || []).forEach(r => {
          const d = new Date(r.date)
          if (d.getMonth() === month && d.getFullYear() === year) {
            const dayOfMonth = d.getDate()
            const bi = Math.min(3, Math.floor((dayOfMonth - 1) / 7))
            buckets[bi] += 1 // each attendance record = 1 point
          }
        })
        // Iterate presentations (1 point per day)
        ;(student.presentationHistory || []).forEach(r => {
          const d = new Date(r.date)
          if (d.getMonth() === month && d.getFullYear() === year) {
            const dayOfMonth = d.getDate()
            const bi = Math.min(3, Math.floor((dayOfMonth - 1) / 7))
            buckets[bi] += 1
          }
        })
        const toTen = (total) => Math.round(((Math.min(15, total)) * (10 / 15)) * 10) / 10
        return [1, 2, 3, 4].map((w, i) => ({ week: `الأسبوع ${w}`, points: toTen(buckets[i]) }))
      }
      case 'yearly': {
        // 12 months; sum all points per month; map to 0..10 by (total/60)*10 (4 weeks * 15)
        const months = ['جانفي','فيفري','مارس','أفريل','ماي','جوان','جويلية','أوت','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
        const totals = new Array(12).fill(0)
        ;(student.attendanceHistory || []).forEach(r => {
          const d = new Date(r.date)
          totals[d.getMonth()] += 1
        })
        ;(student.presentationHistory || []).forEach(r => {
          const d = new Date(r.date)
          totals[d.getMonth()] += 1
        })
        const toTenMonth = (total) => {
          const scaled = (Math.min(60, total) / 60) * 10
          return Math.round(scaled * 10) / 10
        }
        return months.map((m, i) => ({ month: m, points: toTenMonth(totals[i]) }))
      }
      default:
        return []
    }
  }

  const formatDate = (date) => formatAppDate(date, { includeTime: true })

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">جاري تحميل بيانات الطالب...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-100 dark:bg-red-900/40 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300 text-lg">الطالب غير موجود</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="rounded-xl shadow-lg p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl">
                {student.name.split(' ')[0][0]}
              </div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{student.name}</h1>
              {student.isFrozen && (
                <div className="mt-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200 px-3 py-1 rounded-full text-sm font-semibold">
                  مجمد
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* معلومات الطالب الديناميكية */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">الحزب:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-100">{student.hizb || 'غير محدد'}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">الثمن:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-100">{student.quarter || 'غير محدد'}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">النقاط الأسبوعية:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{student.weeklyPoints || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">التقييم الأسبوعي:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{student.weeklyRating || 0}/10</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">التقييم العام مع الحفظ:</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">{student.weeklyRating || 0}/10</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">النجوم:</span>
                <div className="flex items-center">
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400 ml-2">{student.stars || 0}</span>
                  <Star size={16} className="text-yellow-500 dark:text-yellow-400" />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">الغيابات:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">{student.absences || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">رقم الهاتف الشخصي:</span>
                {editingPhone ? (
                  <input
                    type="tel"
                    value={student.phone || ''}
                    onChange={(e) => setStudent(prev => ({ ...prev, phone: e.target.value }))}
                    onBlur={() => setEditingPhone(false)}
                    autoFocus
                    placeholder="رقم الهاتف"
                    className="w-48 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                  />
                ) : (
                  <button
                    onClick={() => setEditingPhone(true)}
                    className="text-right font-semibold text-gray-800 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-300"
                    title="انقر للتعديل"
                  >
                    {student.phone || 'أضف رقم الهاتف'}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">رقم ولي الأمر:</span>
                {editingFatherPhone ? (
                  <input
                    type="tel"
                    value={student.fatherPhone || ''}
                    onChange={(e) => setStudent(prev => ({ ...prev, fatherPhone: e.target.value }))}
                    onBlur={() => setEditingFatherPhone(false)}
                    autoFocus
                    placeholder="رقم ولي الأمر"
                    className="w-48 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                  />
                ) : (
                  <button
                    onClick={() => setEditingFatherPhone(true)}
                    className="text-right font-semibold text-gray-800 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-300"
                    title="انقر للتعديل"
                  >
                    {student.fatherPhone || 'أضف رقم ولي الأمر'}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">تاريخ الانتساب:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-100">{formatDate(student.createdAt || student.created_at)}</span>
              </div>

              <button 
                onClick={async () => {
                  const result = await updateStudent(id, {
                    hizb: student.hizb,
                    quarter: student.quarter,
                    phone: student.phone || '',
                    fatherPhone: student.fatherPhone || ''
                  })
                  if (result.success) {
                    alert('تم تحديث البيانات بنجاح')
                  } else {
                    alert('حدث خطأ في تحديث البيانات')
                  }
                }}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <Edit size={16} className="ml-2" />
                حفظ التغييرات
              </button> 
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl shadow-lg p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                <BookOpen size={24} className="ml-2" />
                تقرير الأداء
              </h2>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('weekly')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'weekly'
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-200'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  الأسبوعي
                </button>
                <button
                  onClick={() => setActiveTab('monthly')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'monthly'
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-200'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  الشهري
                </button>
                <button
                  onClick={() => setActiveTab('yearly')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'yearly'
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-200'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  السنوي
                </button>
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                  <XAxis 
                    dataKey={activeTab === 'weekly' ? 'day' : activeTab === 'monthly' ? 'week' : 'month'} 
                    stroke="#9ca3af"
                  />
                  <YAxis domain={activeTab === 'weekly' ? [0, 15] : [0, 10]} stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background: '#111827', color: '#e5e7eb', border: '1px solid #374151' }} />
                  <Line 
                    type="monotone" 
                    dataKey="points" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    name={activeTab === 'weekly' ? 'مجموع النقاط التراكمي' : 'النقاط (0-10)'}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl shadow-lg p-6 mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">الملاحظات</h3>
            <div className="space-y-3">
              {student.notes.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-300 text-center py-4">لا توجد ملاحظات</p>
              ) : (
                student.notes.map((note, index) => (
                  <div key={note.id || index} className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-800 p-4 rounded-lg border-l-4 border-green-500 dark:border-green-700 relative">
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="absolute top-2 left-2 text-red-500 hover:text-red-700 dark:text-red-300 dark:hover:text-red-200 transition-colors"
                    >
                      <X size={16} />
                    </button>
                    <p className="text-gray-700 dark:text-gray-100 pr-8">{typeof note === 'string' ? note : note.text}</p>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 block">
                      تاريخ الإضافة: {formatDate(typeof note === 'string' ? new Date() : note.date)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl shadow-lg p-6 mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">خصم النقاط</h3>
            <button
              onClick={() => setShowDeductModal(true)}
              className="flex items-center justify-center px-4 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
            >
              <Minus size={20} className="ml-2" />
              خصم نقاط للطالب المشاغب
            </button>
            
            {student.deductions && student.deductions.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">سجل الخصومات:</h4>
                <div className="space-y-2">
                  {student.deductions.map((deduction, index) => (
                    <div key={index} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-l-4 border-red-500 dark:border-red-700">
                      <p className="text-red-700 dark:text-red-300 font-semibold">-{Math.abs(deduction.points)} نقاط</p>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">{deduction.reason}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(deduction.date)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl shadow-lg p-6 mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">إدارة الطالب</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleToggleFreeze}
                className={`flex items-center justify-center px-4 py-3 rounded-lg font-semibold transition-colors ${
                  student.isFrozen
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                }`}
              >
                {student.isFrozen ? (
                  <>
                    <UserCheck size={20} className="ml-2" />
                    إلغاء التجميد
                  </>
                ) : (
                  <>
                    <Snowflake size={20} className="ml-2" />
                    تجميد الطالب
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center justify-center px-4 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                <Trash2 size={20} className="ml-2" />
                حذف الطالب
              </button>
            </div>
            
            {student.isFrozen && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  <strong>ملاحظة:</strong> الطالب المجمد لا يمكنه كسب نقاط أو تسجيل الحضور أو العرض حتى يتم إلغاء التجميد.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-4">
              تأكيد حذف الطالب
            </h3>
            
            <p className="text-gray-700 dark:text-gray-200 mb-6">
              هل أنت متأكد من حذف الطالب <strong>{student?.name}</strong>؟ 
              هذا الإجراء لا يمكن التراجع عنه.
            </p>
            
            <div className="flex space-x-reverse space-x-3">
              <button
                onClick={handleDeleteStudent}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                حذف نهائي
              </button>
              
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeductModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-4">
              خصم نقاط للطالب
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  عدد النقاط المراد خصمها:
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={deductPointsValue}
                  onChange={(e) => setDeductPointsValue(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  سبب الخصم:
                </label>
                <textarea
                  value={deductReason}
                  onChange={(e) => setDeductReason(e.target.value)}
                  placeholder="اكتب سبب خصم النقاط..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 h-20 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            
            <div className="flex space-x-reverse space-x-3 mt-6">
              <button
                onClick={handleDeductPoints}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                خصم النقاط
              </button>
              
              <button
                onClick={() => {
                  setShowDeductModal(false)
                  setDeductPointsValue(1)
                  setDeductReason('')
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
 