import React, { useState, useEffect } from 'react'
import { Users, LogOut, Phone, Mail, MapPin, BookOpen, Edit, Save, X } from 'lucide-react'
import { useAppContext } from '../context/AppContext.jsx'
import { logoutUser } from '../firebase/auth.js'
import { getStudents } from '../firebase/firestore.js'

export default function MySchool() {
  const { appName, user, setUser, schoolData, updateSchoolData } = useAppContext()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    schoolName: schoolData?.schoolName || 'مدرسة جديدة',
    teacherName: schoolData?.teacherName || user?.displayName || 'الشيخ',
    phone: schoolData?.phone || '',
    email: schoolData?.email || user?.email || '',
    address: schoolData?.address || '',
    teacherSubtitle: schoolData?.teacherSubtitle || 'إمام مسجد البشير الإبراهيمي',
    sectionsCount: schoolData?.sectionsCount || 0,
    studentCount: schoolData?.studentCount || 0,
    memorizers: schoolData?.memorizers || 0
  })
  const [actualStudentCount, setActualStudentCount] = useState(0)

  useEffect(() => {
    const fetchStudentCount = async () => {
      const result = await getStudents()
      if (result.success) {
        const newCount = result.students.length
        setActualStudentCount(newCount)
        if (newCount !== (schoolData?.studentCount || 0)) {
          // لا ترسل كل editData لتفادي الكتابة فوق الحقول الأخرى
          await updateSchoolData({ studentCount: newCount })
          setEditData(prev => ({ ...prev, studentCount: newCount }))
        }
      }
    }
    
    if (user) {
      fetchStudentCount()
    }
  }, [user, schoolData])

  useEffect(() => {
    if (schoolData) {
      setEditData({
        schoolName: schoolData.schoolName || 'مدرسة جديدة',
        teacherName: schoolData.teacherName || user?.displayName || 'الشيخ',
        phone: schoolData.phone || '',
        email: schoolData.email || user?.email || '',
        address: schoolData.address || '',
        teacherSubtitle: schoolData.teacherSubtitle || 'إمام مسجد البشير الإبراهيمي',
        sectionsCount: schoolData.sectionsCount || 0,
        studentCount: schoolData.studentCount || 0,
        memorizers: schoolData.memorizers || 0
      })
    }
  }, [schoolData, user])

  const handleLogout = async () => {
    const result = await logoutUser()
    if (result.success) {
      setUser(null)
    }
  }

  const handleSave = async () => {
    const result = await updateSchoolData(editData)
    if (result.success) {
      setIsEditing(false)
      alert('تم حفظ البيانات بنجاح')
    } else {
      alert('حدث خطأ في حفظ البيانات: ' + result.error)
    }
  }

  const handleCancel = () => {
    setEditData({
      schoolName: schoolData?.schoolName || 'مدرسة جديدة',
      teacherName: schoolData?.teacherName || user?.displayName || 'الشيخ',
      phone: schoolData?.phone || '',
      email: schoolData?.email || user?.email || '',
      address: schoolData?.address || '',
      teacherSubtitle: schoolData?.teacherSubtitle || 'إمام مسجد البشير الإبراهيمي',
      studentCount: schoolData?.studentCount || 0,
      memorizers: schoolData?.memorizers || 0
    })
    setIsEditing(false)
  }

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto p-5 relative z-10">
        <header className="text-center mb-12 pt-10 relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-blue-600 via-green-500 to-orange-400 rounded-full"></div>
          
          <h1 className="text-6xl font-bold text-blue-600 dark:text-blue-300 my-5 relative inline-block" style={{fontFamily: 'serif', textShadow: '3px 3px 6px rgba(0,0,0,0.1)'}}>
            {isEditing ? (
              <input
                type="text"
                value={editData.schoolName}
                onChange={(e) => handleInputChange('schoolName', e.target.value)}
                className="bg-transparent border-b-2 border-blue-600 text-center text-6xl font-bold text-blue-600 dark:text-blue-300 focus:outline-none"
                style={{fontFamily: 'serif', textShadow: '3px 3px 6px rgba(0,0,0,0.1)'}}
              />
            ) : (
              schoolData?.schoolName || 'مدرسة جديدة'
            )}
          </h1>
          
          <p className="text-green-700 dark:text-green-300 text-xl mt-4" style={{fontFamily: 'serif'}}>
            بوابة الحفظ والإتقان لكتاب الله عز وجل
          </p>
        </header>

        <main className="bg-white dark:bg-gray-900 rounded-3xl p-8 mb-10 shadow-2xl border border-gray-200 dark:border-gray-800 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 p-8 rounded-2xl border-r-6 border-blue-600">
              <span className="text-4xl block mb-4">📘</span>
              <div className="text-blue-600 dark:text-blue-300 font-semibold text-lg mb-3">اسم المدرسة</div>
              <div className="text-gray-700 dark:text-gray-200 leading-relaxed">
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.schoolName}
                    onChange={(e) => handleInputChange('schoolName', e.target.value)}
                    className="w-full bg-transparent border-b border-blue-300 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-600"
                  />
                ) : (
                  schoolData?.schoolName || 'مدرسة جديدة'
                )}
                <br/>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="عنوان المدرسة"
                    className="w-full bg-transparent border-b border-blue-300 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-600 mt-2"
                  />
                ) : (
                  schoolData?.address || 'لم يتم تحديد العنوان'
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 p-8 rounded-2xl border-r-6 border-blue-600">
              <span className="text-4xl block mb-4">👤</span>
              <div className="text-blue-600 dark:text-blue-300 font-semibold text-lg mb-3">مدير المدرسة</div>
              <div className="text-gray-700 dark:text-gray-200 leading-relaxed">
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.teacherName}
                    onChange={(e) => handleInputChange('teacherName', e.target.value)}
                    className="w-full bg-transparent border-b border-blue-300 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-600"
                  />
                ) : (
                  schoolData?.teacherName || user?.displayName || 'الشيخ'
                )}
                <br/>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.teacherSubtitle}
                    onChange={(e) => handleInputChange('teacherSubtitle', e.target.value)}
                    className="w-full bg-transparent border-b border-blue-300 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-600 mt-2"
                  />
                ) : (
                  schoolData?.teacherSubtitle || 'إمام مسجد البشير الإبراهيمي'
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 p-8 rounded-2xl border-r-6 border-blue-600">
              <span className="text-4xl block mb-4">📞</span>
              <div className="text-blue-600 dark:text-blue-300 font-semibold text-lg mb-3">معلومات التواصل</div>
              <div className="text-gray-700 dark:text-gray-200 leading-relaxed">
                📞 الهاتف: {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="رقم الهاتف"
                    className="w-full bg-transparent border-b border-blue-300 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-600"
                  />
                ) : (
                  schoolData?.phone || 'لم يتم تحديد الهاتف'
                )}
                <br/>
                📧 البريد: {isEditing ? (
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full bg-transparent border-b border-blue-300 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-600"
                  />
                ) : (
                  schoolData?.email || user?.email || 'لم يتم تحديد البريد'
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 p-8 rounded-2xl border-r-6 border-blue-600">
              <span className="text-4xl block mb-4">👨‍🎓</span>
              <div className="text-blue-600 dark:text-blue-300 font-semibold text-lg mb-3">الطلبة والأقسام</div>
              <div className="text-gray-700 dark:text-gray-200 leading-relaxed">
                👩‍🎓 {isEditing ? (
                  <input
                    type="number"
                    value={editData.studentCount}
                    onChange={(e) => handleInputChange('studentCount', parseInt(e.target.value) || 0)}
                    className="w-20 bg-transparent border-b border-blue-300 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-600 text-center"
                  />
                ) : (
                  actualStudentCount
                )} الطلبة
                <br/>
                👩‍🏫 {isEditing ? (
                  <input
                    type="number"
                    value={editData.sectionsCount}
                    onChange={(e) => handleInputChange('sectionsCount', parseInt(e.target.value) || 0)}
                    className="w-20 bg-transparent border-b border-blue-300 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-600 text-center"
                  />
                ) : (
                  schoolData?.sectionsCount || 0
                )} عدد الأقسام
                <br/>
                🏆 {isEditing ? (
                  <input
                    type="number"
                    value={editData.memorizers}
                    onChange={(e) => handleInputChange('memorizers', parseInt(e.target.value) || 0)}
                    className="w-20 bg-transparent border-b border-blue-300 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-600 text-center"
                  />
                ) : (
                  schoolData?.memorizers || 0
                )} الطلبة الخاتمين
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-center gap-4 mt-4">
            {isEditing ? (
              <>
                <button 
                  onClick={handleSave}
                  className="bg-green-600 text-white py-3 px-6 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center font-semibold"
                >
                  <Save size={18} className="ml-2" />
                  حفظ التغييرات
              </button>
              
                <button 
                  onClick={handleCancel}
                  className="bg-gray-500 text-white py-3 px-6 rounded-xl hover:bg-gray-600 transition-colors flex items-center justify-center font-semibold"
                >
                  <X size={18} className="ml-2" />
                  إلغاء التعديل
              </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center font-semibold"
              >
                <Edit size={18} className="ml-2" />
                تعديل بيانات المدرسة
              </button>
            )}

            <button 
              onClick={handleLogout}
              className="bg-red-600 text-white py-3 px-6 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center font-semibold"
            >
              <LogOut size={18} className="ml-2" />
              تسجيل الخروج
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
 