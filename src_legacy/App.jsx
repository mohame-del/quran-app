import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Welcome from './pages/Welcome.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Students from './pages/Students.jsx'
import AddStudent from './pages/AddStudent.jsx'
import Evaluation from './pages/Evaluation.jsx'
import StudentProfile from './pages/StudentProfile.jsx'
import MySchool from './pages/MySchool.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import { AppProvider, useAppContext } from './context/AppContext.jsx'

function AppContent() {
  const { user, loading } = useAppContext()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Welcome />} />
        </Routes>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-16 text-gray-900 dark:text-gray-100">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/add-student" element={<AddStudent />} />
          <Route path="/evaluation" element={<Evaluation />} />
          <Route path="/student/:id" element={<StudentProfile />} />
          <Route path="/my-school" element={<MySchool />} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
 