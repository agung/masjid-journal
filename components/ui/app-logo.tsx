import { cn } from '@/lib/utils'

interface AppLogoProps {
  className?: string
  size?: number
}

/**
 * Simple SVG mosque-inspired logo for Keuangan Masjid.
 * Used on login/register pages and anywhere a brand icon is needed.
 */
export function AppLogo({ className, size = 48 }: AppLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-green-600', className)}
      aria-label="Keuangan Masjid"
    >
      {/* Main dome */}
      <path
        d="M24 6C17.373 6 12 11.373 12 18H36C36 11.373 30.627 6 24 6Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Dome top (finial) */}
      <rect x="22" y="2" width="4" height="6" rx="2" fill="currentColor" />
      {/* Star on dome */}
      <circle cx="24" cy="11" r="2" fill="white" />
      {/* Minaret left */}
      <rect x="8" y="18" width="6" height="20" rx="1" fill="currentColor" opacity="0.8" />
      <path d="M8 18C8 15.791 9.791 14 12 14v0C14.209 14 14 15.791 14 18H8Z" fill="currentColor" opacity="0.8" />
      <rect x="9" y="14" width="4" height="2" rx="1" fill="currentColor" opacity="0.8" />
      {/* Minaret right */}
      <rect x="34" y="18" width="6" height="20" rx="1" fill="currentColor" opacity="0.8" />
      <path d="M34 18C34 15.791 35.791 14 38 14v0C40.209 14 40 15.791 40 18H34Z" fill="currentColor" opacity="0.8" />
      <rect x="35" y="14" width="4" height="2" rx="1" fill="currentColor" opacity="0.8" />
      {/* Main building */}
      <rect x="12" y="26" width="24" height="12" rx="1" fill="currentColor" opacity="0.85" />
      {/* Door */}
      <path d="M20 38V31C20 29.343 21.343 28 23 28H25C26.657 28 28 29.343 28 31V38H20Z" fill="white" opacity="0.9" />
      {/* Windows */}
      <rect x="14" y="28" width="4" height="4" rx="1" fill="white" opacity="0.6" />
      <rect x="30" y="28" width="4" height="4" rx="1" fill="white" opacity="0.6" />
      {/* Ground */}
      <rect x="4" y="38" width="40" height="3" rx="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  )
}
