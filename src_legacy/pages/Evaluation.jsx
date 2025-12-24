import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Star } from 'lucide-react'
import { getStudents, updateStudent } from '../lib/firebaseShim.js'
import { getScoreColor } from '../utils/helpers.js'

export default function Evaluation() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [editModal, setEditModal] = useState(false)
  const [editValues, setEditValues] = useState({ hizb: '', surah: '', parentPhone: '' })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await getStudents()
        setStudents(
          data.map(student => ({
            ...student,
            id: student._id,
            name: `${student.firstName} ${student.lastName || ''}`,
            rating: student.weeklyScore || 0,
            stars: student.stars || 0,
            hizb: student.hizb || '',
            surah: student.surah || '',
            parentPhone: student.parentPhone || '',
          }))
        )
      } catch (err) {
        setError(err.message || 'خطأ في تحميل الطلاب')
      }
      setLoading(false)
    }
    fetchStudents()
  }, [])

  // نافذة الملاحظة (غير مفعلة فعلياً)
  const handleAddNote = async () => {
    alert('ميزة الملاحظات غير مفعلة بعد. يمكنك ربطها بـ addEvaluation أو إضافة endpoint خاص.')
    setNoteText('')
    setShowNoteModal(false)
    setSelectedStudent(null)
  }

  const handleEditStudent = async (e) => {
    e.preventDefault()
    setEditLoading(true)
    setEditError('')
    setEditSuccess('')
    // تحقق رقم الهاتف
    const phoneRegex = /^0[5-7][0-9]{8}$/
    if (editValues.parentPhone && !phoneRegex.test(editValues.parentPhone)) {
      setEditError('رقم ولي الأمر غير صحيح')
      setEditLoading(false)
      return
    }
    try {
      await updateStudent(selectedStudent.id, {
        hizb: editValues.hizb,
        surah: editValues.surah,
        parentPhone: editValues.parentPhone
      })
      setEditSuccess('تم تحديث البيانات بنجاح')
      setStudents(prev => prev.map(s =>
        s.id === selectedStudent.id
          ? { ...s, hizb: editValues.hizb, surah: editValues.surah, parentPhone: editValues.parentPhone }
          : s
      ))
      setTimeout(() => {
        setEditModal(false)
        setSelectedStudent(null)
        setEditSuccess('')
      }, 1200)
    } catch (err) {
      setEditError('حدث خطأ أثناء التحديث')
    }
    setEditLoading(false)
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
      <h1 className="text-3xl font-bold text-green-800 dark:text-green-300 text-center mb-8">التقييم</h1>
      <div className="rounded-xl shadow-lg overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <div className="p-6">
          {students.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-300 text-lg">لا يوجد طلاب مسجلين بعد</p>
              <Link
                to="/add-student"
                className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                إضافة طالب جديد
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex justify-between items-center p-4 rounded-lg border transition-all bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-md"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1">
                      <Link to={`/student/${student.id}`}>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                          {student.name}
                        </h3>
                      </Link>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          setSelectedStudent(student)
                          setShowNoteModal(true)
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center"
                      >
                        <MessageSquare size={14} className="ml-1" />
                        ملاحظة
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStudent(student)
                          setEditModal(true)
                          setEditValues({
                            hizb: student.hizb || '',
                            surah: student.surah || '',
                            parentPhone: student.parentPhone || ''
                          })
                          setEditError('')
                          setEditSuccess('')
                        }}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center"
                      >
                        تحديث البيانات
                      </button>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(student.rating)}`}>
                        {student.rating.toFixed(1)}/10
                      </div>
                      <div className="flex items-center ml-2">
                        {[...Array(student.stars || 0)].map((_, i) => (
                          <Star key={i} size={16} className="text-yellow-400" fill="#facc15" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* نافذة التعديل */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              تعديل بيانات الطالب: {selectedStudent?.name}
            </h3>
            <form onSubmit={handleEditStudent}>
              <div className="mb-4">
                <label className="block mb-1 font-semibold">الحزب</label>
                <input
                  type="text"
                  value={editValues.hizb}
                  onChange={e => setEditValues(v => ({ ...v, hizb: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold">السورة</label>
                <input
                  type="text"
                  value={editValues.surah}
                  onChange={e => setEditValues(v => ({ ...v, surah: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold">رقم ولي الأمر</label>
                <input
                  type="tel"
                  value={editValues.parentPhone}
                  onChange={e => setEditValues(v => ({ ...v, parentPhone: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  pattern="^0[5-7][0-9]{8}$"
                  required
                  placeholder="05xxxxxxxx"
                />
              </div>
              {editError && <div className="text-red-600 mb-2">{editError}</div>}
              {editSuccess && <div className="text-green-600 mb-2">{editSuccess}</div>}
              <div className="flex space-x-reverse space-x-3 mt-4">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  disabled={editLoading}
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditModal(false)
                    setSelectedStudent(null)
                    setEditError('')
                    setEditSuccess('')
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* نافذة الملاحظة */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              إضافة ملاحظة للطالب: {selectedStudent?.name}
            </h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="اكتب ملاحظتك هنا..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 h-32 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <div className="flex space-x-reverse space-x-3 mt-4">
              <button
                onClick={handleAddNote}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                حفظ الملاحظة
              </button>
              <button
                onClick={() => {
                  setShowNoteModal(false)
                  setSelectedStudent(null)
                  setNoteText('')
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