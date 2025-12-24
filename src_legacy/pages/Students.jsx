import { setVacationMode, getVacationMode } from '../firebase/vacation.js'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, Edit, Star } from 'lucide-react'
import { getStudents, recordAttendance, recordPresentation, updateStudent } from '../firebase/firestore.js'
import { formatAppDate } from '../utils/date.js'
import { normalizePeriod } from '../utils/helpers.js'
import { useAppContext } from '../context/AppContext.jsx'

export default function Students() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [vacationMode, setVacationModeState] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    totalStudents: 0,
    morningPresent: 0,
    eveningPresent: 0,
    attendanceRate: 0
  })
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)

  useEffect(() => {
    fetchStudents()
    getVacationMode().then(res => {
      if (res.success) setVacationModeState(res.isVacation)
    })
  }, [])

  const { schoolData, updateSchoolData, attendanceMode, toggleAttendanceMode } = useAppContext()

    const fetchStudents = async () => {
        const result = await getStudents()
        if (result.success) {
          setStudents(result.students)
          calculateStats(result.students)
        } else {
          setError(result.error)
        }
        setLoading(false)
    }
    


  const calculateStats = (studentsList) => {
    const today = new Date().toISOString().split('T')[0]
    let morningPresent = 0
    let eveningPresent = 0

    studentsList.forEach(student => {
      const todayAttendance = (student.attendanceHistory || []).filter(record => record.date === today)
      if (todayAttendance.find(record => normalizePeriod(record.period) === 'morning')) morningPresent++
      if (todayAttendance.find(record => normalizePeriod(record.period) === 'evening')) eveningPresent++
    })

    // حساب نسبة الحضور بناءً على الوضع الحالي
    let totalPossibleAttendance = studentsList.length * 2 // صباح + مساء
    if (attendanceMode === 'winter') {
      totalPossibleAttendance = studentsList.length * 1 // مساء فقط
    }

    const attendanceRate = totalPossibleAttendance > 0 
      ? Math.round(((morningPresent + eveningPresent) / totalPossibleAttendance) * 100) 
      : 0

    setStats({
      totalStudents: studentsList.length,
      morningPresent,
      eveningPresent,
      attendanceRate
    })
  }

  const handleAttendance = async (studentId, period) => {
    // في الشتاء: لا يوجد صباح، والمساء يمنح نقطتين
    if (attendanceMode === 'winter') {
      if (period === 'صباح') {
        alert('في الوضع الشتوي لا يوجد حضور صباحي')
        return
      }
      const res1 = await recordAttendance(studentId, 'مساء')
      if (!res1.success) {
        alert(res1.error)
        return
      }
      // تسجيل نقطة إضافية لنفس اليوم كتعويض (تصبح نقطتان)
      const res2 = await recordAttendance(studentId, 'مساء-إضافي')
      const weeklyPoints = (res1.weeklyPoints || 0) + (res2.success ? 1 : 0)
      const dailyPoints = (res1.dailyPoints || 0) + (res2.success ? 1 : 0)
      const updatedHistory = res1.attendanceHistory // العرض الأول يعيد التاريخ كاملاً
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, weeklyPoints, dailyPoints, attendanceHistory: updatedHistory } : s))
      calculateStats(students.map(s => s.id === studentId ? { ...s, weeklyPoints, dailyPoints, attendanceHistory: updatedHistory } : s))
      alert('تم تسجيل حضور المساء (وضع شتوي - نقطتان)')
      return
    }

    const result = await recordAttendance(studentId, period)
    if (result.success) {
      const updated = students.map(student => 
          student.id === studentId 
            ? { 
                ...student, 
                weeklyPoints: result.weeklyPoints,
              dailyPoints: result.dailyPoints,
              attendanceHistory: result.attendanceHistory 
              }
            : student
      )
      setStudents(updated)
      calculateStats(updated)
      alert(`تم تسجيل الحضور ${period} بنجاح`)
    } else {
      alert(result.error)
    }
  }

  const handlePresentation = async (studentId) => {
    const result = await recordPresentation(studentId)
    if (result.success) {
      const updated = students.map(student => 
          student.id === studentId 
            ? { 
                ...student, 
                weeklyPoints: result.weeklyPoints,
              dailyPoints: result.dailyPoints,
                weeklyRating: result.weeklyRating,
              stars: result.stars
              }
            : student
      )
      setStudents(updated)
      calculateStats(updated)
      alert('تم تسجيل الحفظ بنجاح')
    } else {
      alert(result.error)
    }
  }

  const handleEditStudent = (student) => {
    setEditingStudent({...student})
    setShowEditModal(true)
  }

  const handleUpdateStudent = async () => {
    const result = await updateStudent(editingStudent.id, editingStudent)
    if (result.success) {
      setStudents(prev => 
        prev.map(student => 
          student.id === editingStudent.id 
            ? editingStudent 
            : student
        )
      )
      setShowEditModal(false)
      setEditingStudent(null)
      alert('تم تحديث بيانات الطالب بنجاح')
    } else {
      alert('حدث خطأ في تحديث البيانات: ' + result.error)
    }
  }

  const handleEditChange = (field, value) => {
    setEditingStudent(prev => ({
      ...prev,
      [field]: value
    }))
  } 

  const isAttendanceRecorded = (student, period) => {
    const today = new Date().toISOString().split('T')[0]
    const normalizedTarget = normalizePeriod(period)
    return (student.attendanceHistory || []).some(record => 
      record.date === today && normalizePeriod(record.period) === normalizedTarget
    ) || false
  }

  const isPresentationRecorded = (student) => {
    const today = new Date().toISOString().split('T')[0]
    return (student.presentationHistory || []).some(record => 
      record.date === today
    ) || false
  }

  const todayAbsencesForStudent = (student) => {
    const today = new Date().toISOString().split('T')[0]
    const todayAttendance = (student.attendanceHistory || []).filter(r => r.date === today)
    const presentMorning = todayAttendance.some(r => normalizePeriod(r.period) === 'morning') ? 1 : 0
    const presentEvening = todayAttendance.some(r => normalizePeriod(r.period) === 'evening') ? 1 : 0
    const presentCount = presentMorning + presentEvening
    return Math.max(0, 2 - presentCount)
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">جاري تحميل الطلاب...</p>
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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold text-green-800 dark:text-green-300 flex items-center">
          <Users size={32} className="ml-3" />
          الطلاب
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAttendanceMode}
            className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
            title="تبديل وضع الحضور صيفي/شتوي"
          >
            الوضع: {attendanceMode === 'summer' ? 'صيفي' : 'شتوي'}
          </button>
          <button
            onClick={async () => {
              const newVacation = !vacationMode
              const res = await setVacationMode(newVacation)
              if (res.success) {
                setVacationModeState(newVacation)
                setStudents(prev => prev.map(s => ({ ...s, isFrozen: newVacation })))
              }
            }}
            className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors ${vacationMode ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}
          >
            {vacationMode ? 'إنهاء العطلة' : 'عطلة'}
          </button>
          <Link 
            to="/add-student"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Plus size={20} className="ml-2" />
            إضافة طالب جديد
          </Link>
        </div>
      </div>
      {/* زر البحث */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ابحث عن طالب..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>
      <div className="mb-6 text-gray-600 dark:text-gray-300">
        تاريخ اليوم: {formatAppDate(new Date(), { includeTime: false })}
          </div>
          
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl shadow-lg p-6 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-300">{stats.totalStudents}</div>
          <div className="text-gray-600 dark:text-gray-300">إجمالي الطلاب</div>
          </div>
          
        <div className="rounded-xl shadow-lg p-6 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="text-3xl font-bold text-green-600 dark:text-green-300">{stats.morningPresent}</div>
          <div className="text-gray-600 dark:text-gray-300">حضور الصباح</div>
          </div>
          
        <div className="rounded-xl shadow-lg p-6 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="text-3xl font-bold text-green-600 dark:text-green-300">{stats.eveningPresent}</div>
          <div className="text-gray-600 dark:text-gray-300">حضور المساء</div>
        </div>

        <div className="rounded-xl shadow-lg p-6 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-300">{stats.attendanceRate}%</div>
          <div className="text-gray-600 dark:text-gray-300">نسبة الحضور اليوم</div>
          </div>
            </div>
            
      {students.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">لا يوجد طلاب مسجلين بعد</p>
          <Link 
            to="/add-student"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center"
          >
            <Plus size={20} className="ml-2" />
            إضافة أول طالب
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {(() => {
            // تصفية حسب البحث
            let filtered = students.filter(s => `${s.firstName} ${s.lastName}`.includes(search))
            // ترتيب الطلبة: الحاضرون في الأعلى، المجمدون في الأسفل، الغائبون في الأسفل
            filtered = filtered.sort((a, b) => {
              if (vacationMode) {
                // كل الطلبة مجمدون
                return a.isFrozen === b.isFrozen ? 0 : a.isFrozen ? 1 : -1
              }
              // الحاضرون في الأعلى، الغائبون في الأسفل
              if (a.isFrozen !== b.isFrozen) return a.isFrozen ? 1 : -1
              if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
              return 0
            })
            return filtered.map((student) => (
              <div 
                key={student.id}
                className="rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-reverse space-x-4">
                    <Link 
                      to={`/student/${student.id}`}
                      className="font-semibold text-gray-800 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-300 transition-colors cursor-pointer"
                    >
                      <span>{student.firstName} {student.lastName}</span>
                      {student.isFrozen && (
                        <span className="text-red-500 dark:text-red-300 mr-2 text-sm">(مجمّد)</span>
                      )}
                    </Link>
                    <div className="flex items-center space-x-reverse space-x-2">
                      <div className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200">
                        {student.weeklyPoints || 0} نقطة
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i}
                            size={14}
                            className={`${i < (student.stars || 0) ? 'text-yellow-500 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div> 
                  <div className="flex items-center space-x-reverse space-x-3">
                    <button
                      onClick={() => handlePresentation(student.id)}
                      disabled={student.isFrozen || isPresentationRecorded(student)}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isPresentationRecorded(student)
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 cursor-default'
                          : student.isFrozen
                            ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {isPresentationRecorded(student) ? 'تم الحفظ' : 'حفظ'}
                    </button>
                    <button 
                      onClick={() => handleAttendance(student.id, 'صباح')}
                      disabled={attendanceMode === 'winter' || student.isFrozen || isAttendanceRecorded(student, 'صباح')}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        attendanceMode === 'winter'
                          ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'
                          : isAttendanceRecorded(student, 'صباح')
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200 cursor-default'
                            : student.isFrozen
                              ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'
                              : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {attendanceMode === 'winter' ? 'غير متاح' : (isAttendanceRecorded(student, 'صباح') ? 'حاضر ص' : 'صباح')}
                    </button>
                    <button 
                      onClick={() => handleAttendance(student.id, 'مساء')}
                      disabled={student.isFrozen || isAttendanceRecorded(student, 'مساء')}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isAttendanceRecorded(student, 'مساء')
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200 cursor-default'
                          : student.isFrozen
                            ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'
                            : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {attendanceMode === 'winter' ? 'مساء (2 نقطة)' : (isAttendanceRecorded(student, 'مساء') ? 'حاضر م' : 'مساء')}
                    </button>
                    <button 
                      onClick={() => handleEditStudent(student)}
                      className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                    >
                      <Edit size={14} className="ml-1" />
                      تعديل
                    </button>
                  </div> 
                </div>
              </div>
            ))
          })()}
        </div>
      )}

      {/* Modal تعديل الطالب */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              تعديل بيانات الطالب - {editingStudent.firstName} {editingStudent.lastName}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم الأول</label>
                <input
                  type="text"
                  value={editingStudent.firstName}
                  onChange={(e) => handleEditChange('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم الأخير</label>
                <input
                  type="text"
                  value={editingStudent.lastName}
                  onChange={(e) => handleEditChange('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم ولي الأمر</label>
                <input
                  type="tel"
                  value={editingStudent.fatherPhone || ''}
                  onChange={(e) => handleEditChange('fatherPhone', e.target.value)}
                  placeholder="أدخل رقم هاتف ولي الأمر"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الحزب</label>
                  <select
                    value={editingStudent.hizb}
                    onChange={(e) => handleEditChange('hizb', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الثمن</label>
                  <select
                    value={editingStudent.quarter}
                    onChange={(e) => handleEditChange('quarter', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    {Array.from({ length: 8 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-reverse space-x-3 mt-6">
              <button
                onClick={handleUpdateStudent}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                تحديث
              </button>
              
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingStudent(null)
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
 