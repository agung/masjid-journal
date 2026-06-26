'use client'

import { useEffect, useState } from 'react'
import { AppLogo } from './app-logo'

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true)
  const [isFadingOut, setIsFadingOut] = useState(false)

  useEffect(() => {
    // Check if splash has already been shown in this session to prevent interrupting page navigation
    const hasShown = sessionStorage.getItem('pwa-splash-shown')
    if (hasShown) {
      setIsVisible(false)
      return
    }

    const timer = setTimeout(() => {
      setIsFadingOut(true)
      const removeTimer = setTimeout(() => {
        setIsVisible(false)
        sessionStorage.setItem('pwa-splash-shown', 'true')
      }, 500) // Matches transition duration
      return () => clearTimeout(removeTimer)
    }, 1600) // Keep the splash screen for 1.6s

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1A5C3A] transition-opacity duration-500 ease-out select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Self-contained CSS pulse animations */}
      <style>{`
        @keyframes splash-pulse {
          0%, 100% {
            transform: scale(0.96);
            opacity: 0.95;
          }
          50% {
            transform: scale(1.02);
            opacity: 1;
          }
        }
        .animate-splash-pulse {
          animation: splash-pulse 2.2s infinite ease-in-out;
        }
      `}</style>

      <div className="flex flex-col items-center text-center px-6 animate-splash-pulse">
        <AppLogo
          size={120}
          layout="vertical"
          themeMode="white"
          tagline="Masjid Digital, Umat Terhubung"
        />
      </div>
    </div>
  )
}
