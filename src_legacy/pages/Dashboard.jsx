import React, { useState, useEffect } from 'react'
import { Star, Award } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getStudents } from '../firebase/firestore.js'
import { getRankBorder, getRankBadge } from '../utils/helpers.js'

export default function Dashboard() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStudents = async () => {
      const result = await getStudents()
      if (result.success) {
        // تحويل البيانات إلى الشكل المطلوب للترتيب
        const formattedStudents = result.students.map(student => ({
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          stars: student.stars || 0,
          absences: 0, // سيتم حسابها من سجل الحضور
          hizb: student.hizb || 1,
          weeklyPoints: student.weeklyPoints || 0,
          weeklyRating: student.weeklyRating || 0
        }))
        
        // ترتيب الطلاب حسب النقاط الأسبوعية
        formattedStudents.sort((a, b) => b.weeklyPoints - a.weeklyPoints)
        setStudents(formattedStudents)
      } else {
        setError(result.error)
      }
      setLoading(false)
    }
    
    fetchStudents()
  }, [])
  
 

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الطلاب...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-green-800 mb-2">ترتيب الطلبة</h1>
        <p className="text-gray-600">حسب التقييم والأداء</p>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">لا يوجد طلاب مسجلين بعد</p>
          <button 
            onClick={() => navigate('/add-student')}
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            إضافة طالب جديد
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {students.map((student, index) => (
                   <div 
            key={student.id}
            onClick={() => navigate(`/student/${student.id}`)}
            className={`bg-white rounded-xl p-6 shadow-lg border-2 ${getRankBorder(index)} hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group`}
          > 
            <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-reverse space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform relative">
                  {index + 1}
                  {getRankBadge(index) && (
                    <div className="absolute -top-2 -right-2">
                      {getRankBadge(index)}
                    </div>
                  )}
                </div> 
                
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg group-hover:text-green-700 transition-colors">{student.name}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    الأحزاب المحفوظة: <span className="font-semibold text-green-600">{student.hizb}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-reverse space-x-6">
                <div className="flex justify-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i}
                      size={18}
                      className={`${i < student.stars ? 'star-gold fill-current' : 'text-gray-300'} group-hover:scale-110 transition-transform`}
                    />
                  ))}
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-500">التقييم</div>
                  <div className="font-semibold text-green-600">
                    {student.weeklyRating || 0}/10
                  </div>
                </div>

                {index >= students.length - 5 && (
                  <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-semibold group-hover:bg-red-100 transition-colors">
                    في خطر
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  )
}
 