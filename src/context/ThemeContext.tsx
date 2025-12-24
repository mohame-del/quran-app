'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'default' | 'dark' | 'summer' | 'winter' | 'holiday'

type ThemeContextType = {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('default')

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as Theme) || 'default'
    setThemeState(saved)
  }, [])

  useEffect(() => {
    // remove previous theme classes
    document.documentElement.classList.remove('theme-default', 'theme-dark', 'theme-summer', 'theme-winter', 'theme-holiday')
    document.documentElement.classList.add(`theme-${theme}`)

    // Toggle Tailwind Dark Mode
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    localStorage.setItem('theme', theme)
  }, [theme])

  const setTheme = (t: Theme) => setThemeState(t)

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
