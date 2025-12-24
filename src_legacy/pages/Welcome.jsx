import { Link } from 'react-router-dom'
import { BookOpen, Mail, Phone } from 'lucide-react'

export default function Welcome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-green-400 rounded-full animate-bounce"></div>
        <div className="absolute top-20 right-20 w-16 h-16 bg-blue-400 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-purple-400 rounded-full animate-bounce"></div>
        <div className="absolute bottom-10 right-10 w-12 h-12 bg-yellow-400 rounded-full animate-pulse"></div>
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        {/* اللوغو */}
        <div className="text-center mb-12">
          <div className="w-32 h-32 mx-auto mb-8 flex items-center justify-center">
            <img 
              src="https://imagedelivery.net/FIZL8110j4px64kO6qJxWA/bfd73f8a-6405-40cb-fc49-234bf7906a00/public"
              alt="تطبيق الريّان"
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
            />
          </div>
          <h1 className="text-5xl font-bold text-gray-800 dark:text-white mb-4" style={{fontFamily: 'serif'}}>
            تطبيق الريّان للقرآن الكريم
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            بوابة الحفظ والإتقان لكتاب الله عز وجل
          </p>
        </div>
        {/* الآية القرآنية */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-12 shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-4xl mb-4">📖</div>
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-4" style={{fontFamily: 'serif'}}>
              وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              سورة المزمل - آية 4
            </p>
          </div>
        </div>
        {/* أزرار تسجيل الدخول والتسجيل */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            to="/login"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            تسجيل الدخول
          </Link>
          <Link
            to="/register"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            إنشاء حساب جديد
          </Link>
        </div>
        {/* رسالة الصدقة */}
        <div className="bg-gradient-to-r from-yellow-100 to-green-100 dark:from-yellow-900/40 dark:to-green-900/40 rounded-2xl p-8 mb-12 border border-yellow-300 dark:border-yellow-800 shadow-lg">
          <div className="text-center">
            <div className="text-3xl mb-4 text-yellow-600">🤲</div>
            <h3 className="text-xl font-bold text-yellow-700 dark:text-yellow-300 mb-2" style={{fontFamily:'Amiri, serif'}}>
              صدقة جارية
            </h3>
            <p className="text-gray-700 dark:text-gray-200 leading-relaxed text-lg">
              هذا التطبيق صنع صدقة جارية لأخي المتوفى، أسأل الله أن يتقبل منه وأن يجعله في ميزان حسناته.
              <br />
              <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                اللهم ارحمه واغفر له وأسكنه فسيح جناتك
              </span>
            </p>
          </div>
        </div>
        {/* معلومات المطور */}
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl p-8 shadow-xl border border-yellow-300 dark:border-yellow-700">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6" style={{fontFamily:'Amiri, serif'}}>
              معلومات المطور
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-reverse space-x-4">
                <span className="text-gray-600 dark:text-gray-300">الاسم الكامل:</span>
                <span className="font-semibold text-gray-800 dark:text-white">وزير محمد الغزالي</span>
              </div>
              <div className="flex items-center justify-center space-x-reverse space-x-4">
                <Mail size={20} className="text-yellow-600 dark:text-yellow-400" />
                <a 
                  href="mailto:mohamedelghazali982@gmail.com"
                  className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 font-semibold transition-colors"
                >
                  mohamedelghazali982@gmail.com
                </a>
              </div>
              <div className="flex items-center justify-center space-x-reverse space-x-4">
                <Phone size={20} className="text-yellow-600 dark:text-yellow-400" />
                <a 
                  href="https://wa.me/0791315345"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 font-semibold transition-colors"
                >
                  0791315345
                </a>
              </div>
            </div>
          </div>
        </div>
        {/* حقوق النشر */}
        <div className="text-center mt-12">
          <p className="text-yellow-700 dark:text-yellow-400 font-semibold">
            © 2024 تطبيق الريّان للقرآن الكريم. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </div>
  )
} 