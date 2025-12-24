import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientThemeProvider from '@/components/ClientThemeProvider'
import { AuthProvider } from '@/context/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'تطبيق الريان - إدارة المدارس القرآنية',
    description: 'نظام احترافي لإدارة الحلقات والمدارس القرآنية',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ar" dir="rtl">
            <body className={inter.className}>
                <ClientThemeProvider>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </ClientThemeProvider>
            </body>
        </html>
    )
}
