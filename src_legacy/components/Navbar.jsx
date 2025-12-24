import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Users, BookOpen, User, Search, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getStudents } from '../firebase/firestore.js'
import { useAppContext } from '../context/AppContext.jsx'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredStudents, setFilteredStudents] = useState([])
  const [students, setStudents] = useState([])
  const { darkMode, toggleDarkMode } = useAppContext()

  const isActive = (path) => location.pathname === path



  // جلب الطلاب عند تحميل المكون
  useEffect(() => {
    const fetchStudents = async () => {
      const result = await getStudents()
      if (result.success) {
        setStudents(result.students)
      }
    }
    fetchStudents()
  }, [])

  const handleSearchChange = (e) => {
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

  const handleStudentSelect = (studentId) => {
    navigate(`/student/${studentId}`)
    setSearchOpen(false)
    setSearchQuery('')
    setFilteredStudents([])
  } 

  return (
    <nav className="fixed top-0 w-full bg-white dark:bg-gray-900 shadow-lg z-50 border-b-2 border-green-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-reverse space-x-4">
            <img 
              src="https://imagedelivery.net/FIZL8110j4px64kO6qJxWA/bfd73f8a-6405-40cb-fc49-234bf7906a00/public"
              alt="تطبيق الريّان"
              className="h-10 w-10 rounded-full object-cover"
            /> 
            <h1 className="text-xl font-bold text-green-800 dark:text-green-300">تطبيق الريّان</h1> 
          </div>

          <div className="flex items-center space-x-reverse space-x-6">
            <Link 
              to="/" 
              className={`flex items-center space-x-reverse space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'text-gray-600 dark:text-gray-300 hover:text-green-800 dark:hover:text-green-200'
              }`}
            >
              <Home size={20} />
              <span>الرئيسية</span>
            </Link>

            <Link 
              to="/students" 
              className={`flex items-center space-x-reverse space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/students') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'text-gray-600 dark:text-gray-300 hover:text-green-800 dark:hover:text-green-200'
              }`}
            >
              <Users size={20} />
              <span>الطلبة</span>
            </Link>

            <Link 
              to="/evaluation" 
              className={`flex items-center space-x-reverse space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/evaluation') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'text-gray-600 dark:text-gray-300 hover:text-green-800 dark:hover:text-green-200'
              }`}
            >
              <BookOpen size={20} />
              <span>التقييم</span>
            </Link>

            <Link 
              to="/my-school" 
              className={`flex items-center space-x-reverse space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/my-school') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'text-gray-600 dark:text-gray-300 hover:text-green-800 dark:hover:text-green-200'
              }`}
            >
              <User size={20} />
              <span>مدرستي</span>
            </Link>

            <button 
              onClick={toggleDarkMode}
              className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="الوضع الداكن"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            <div className="relative">
              {!searchOpen ? (
                <button 
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <Search size={16} className="ml-2" />
                  <span className="text-sm">البحث عن طالب...</span>
                </button>
              ) : (
                <div className="flex items-center bg-white dark:bg-gray-900 border-2 border-green-500 rounded-full px-4 py-2 min-w-[300px]">
                  <Search size={16} className="text-green-600 ml-2" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="اكتب اسم الطالب..."
                    className="flex-1 outline-none text-sm bg-transparent text-gray-900 dark:text-gray-100"
                    autoFocus
                  />
                  <button 
                    onClick={() => {
                      setSearchOpen(false)
                      setSearchQuery('')
                      setFilteredStudents([])
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 mr-2"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              
              {searchOpen && filteredStudents.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleStudentSelect(student.id)}
                      className="w-full text-right px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                    >
                      <span className="font-medium text-gray-800 dark:text-gray-100">{student.firstName} {student.lastName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div> 
          </div>
        </div>

        
      </div>
    </nav>
  )
}
 