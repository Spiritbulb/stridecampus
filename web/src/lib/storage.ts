'use client'
// This is for mobile storage
export const storage = {
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error)
      return null
    }
  },
  
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error setting ${key} to localStorage:`, error)
    }
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error)
    }
  },
  
  clear: (): void => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.clear()
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }
}