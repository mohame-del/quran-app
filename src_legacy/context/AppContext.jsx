import React, { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChange } from '../firebase/auth.js'
import { getSchoolData, createSchoolData } from '../firebase/firestore.js'

const AppContext = createContext()

export const AppProvider = ({ children }) => {
  const [appName, setAppName] = useState('تطبيق الريّان للقرآن الكريم')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [schoolData, setSchoolData] = useState(null)
  const [attendanceMode, setAttendanceMode] = useState(localStorage.getItem('attendanceMode') || 'summer')
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true')

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setUser(user)
      if (user) {
        const result = await getSchoolData(user.uid)
        if (result.success) {
          const schoolDataWithDefaults = {
            attendanceMode: result.schoolData.attendanceMode || attendanceMode,
            ...result.schoolData
          }
          setSchoolData(schoolDataWithDefaults)
          setAppName(result.schoolData?.schoolName || 'تطبيق الريّان للقرآن الكريم')
        } else {
          const newSchoolData = {
            schoolName: 'مدرسة جديدة',
            teacherName: user.displayName || 'الشيخ',
            phone: '',
            email: user.email,
            address: '',
            sectionsCount: 0,
            studentCount: 0,
            memorizers: 0,
            teacherSubtitle: 'إمام مسجد البشير الإبراهيمي',
            attendanceMode: attendanceMode,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          const createResult = await createSchoolData(user.uid, newSchoolData)
          if (createResult.success) {
            setSchoolData(newSchoolData)
            setAppName(newSchoolData.schoolName)
          }
        }
      } else {
        setSchoolData(null)
        setAppName('تطبيق الريّان للقرآن الكريم')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const updateSchoolData = async (newData) => {
    if (user) {
      const merged = { ...schoolData, ...newData, updatedAt: new Date() }
      const result = await createSchoolData(user.uid, merged)
      if (result.success) {
        setSchoolData(merged)
        if (newData.schoolName) setAppName(newData.schoolName)
        return { success: true }
      }
      return { success: false, error: result.error }
    }
    return { success: false, error: 'لا يوجد مستخدم مسجل' }
  }

  const toggleAttendanceMode = () => {
    const newMode = attendanceMode === 'summer' ? 'winter' : 'summer'
    setAttendanceMode(newMode)
    localStorage.setItem('attendanceMode', newMode)
    if (schoolData) {
      updateSchoolData({ attendanceMode: newMode })
    }
  }

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode)
  }

  const value = {
    appName,
    setAppName,
    user,
    setUser,
    loading,
    schoolData,
    updateSchoolData,
    attendanceMode,
    toggleAttendanceMode,
    darkMode,
    toggleDarkMode
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)
 