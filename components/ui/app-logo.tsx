import { cn } from '@/lib/utils'

interface AppLogoProps {
  className?: string
  size?: number // Represents the height of the logo (default: 48)
  layout?: 'horizontal' | 'vertical' | 'icon-only'
  themeMode?: 'light' | 'dark' | 'auto' | 'white' // 'auto' adapts via dark: classes
  showTagline?: boolean
  tagline?: string
}

/**
 * Premium AppLogo component for Masjidku Online.
 * Supports light mode, dark mode (without green background),
 * and different layouts (horizontal, vertical, icon-only).
 */
export function AppLogo({
  className,
  size = 48,
  layout = 'horizontal',
  themeMode = 'auto',
  showTagline = true,
  tagline = 'Masjid Digital, Umat Terhubung',
}: AppLogoProps) {
  // Compute width based on the layout's aspect ratio
  // icon-only: 4:3 (width = size * 1.33)
  // horizontal: 340:90 => ~3.78:1 (width = size * 3.78)
  // vertical: 240:180 => ~1.33:1 (width = size * 1.33)
  let width = size
  let viewBox = '0 0 240 240'

  if (layout === 'icon-only') {
    width = Math.round(size * 1.33)
    viewBox = '40 20 120 90'
  } else if (layout === 'horizontal') {
    width = Math.round(size * 3.78)
    viewBox = '40 20 340 90'
  } else if (layout === 'vertical') {
    width = Math.round(size * 1.33)
    viewBox = '0 0 240 180'
  }

  // Theme styling helpers
  // Primary green in dark mode matches the primary button color: #3ECF8E
  const getThemeClasses = (element: 'dome' | 'gold' | 'masjidku' | 'online' | 'tagline') => {
    switch (element) {
      case 'dome':
        if (themeMode === 'white') return 'stroke-white'
        if (themeMode === 'light') return 'stroke-[#1A5C3A]'
        if (themeMode === 'dark') return 'stroke-[#3ECF8E]'
        return 'stroke-[#1A5C3A] dark:stroke-[#3ECF8E]'
      case 'gold':
        return 'stroke-[#C8A84B]'
      case 'masjidku':
        if (themeMode === 'white') return 'fill-white'
        if (themeMode === 'light') return 'fill-[#1A5C3A]'
        if (themeMode === 'dark') return 'fill-[#3ECF8E]'
        return 'fill-[#1A5C3A] dark:fill-[#3ECF8E]'
      case 'online':
        return 'fill-[#C8A84B]'
      case 'tagline':
        if (themeMode === 'white') return 'fill-white/80'
        if (themeMode === 'light') return 'fill-[#596573]'
        if (themeMode === 'dark') return 'fill-[#3ECF8E]/80'
        return 'fill-[#596573] dark:fill-[#3ECF8E]/80'
      default:
        return ''
    }
  };

  const getCircleThemeClasses = () => {
    if (themeMode === 'white') return 'fill-white'
    if (themeMode === 'light') return 'fill-[#1A5C3A]'
    if (themeMode === 'dark') return 'fill-[#3ECF8E]'
    return 'fill-[#1A5C3A] dark:fill-[#3ECF8E]'
  };

  return (
    <svg
      viewBox={viewBox}
      width={width}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className={cn('select-none max-w-full h-auto', className)}
      style={{ minWidth: layout === 'icon-only' ? `${size}px` : undefined }}
    >
      {/* 1. Icon Only View: Centered at 100 inside 40 20 120 90 */}
      {layout === 'icon-only' && (
        <g>
          {/* Mosque Dome Mark */}
          <path
            d="M60 75C65 55 80 40 100 40C120 40 135 55 140 75"
            fill="none"
            className={cn('transition-colors duration-200', getThemeClasses('dome'))}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Antenna Stem */}
          <path
            d="M100 40V31"
            fill="none"
            className={cn('transition-colors duration-200', getThemeClasses('dome'))}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Top Circle */}
          <circle
            cx="100"
            cy="27"
            r="4"
            className={cn('transition-colors duration-200', getCircleThemeClasses())}
          />
          {/* Golden/Connectivity Curves */}
          <path
            d="M72 82C82 78 118 78 128 82"
            fill="none"
            className={getThemeClasses('gold')}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M66 91C78 86 122 86 134 91"
            fill="none"
            className={getThemeClasses('gold')}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M60 100C75 94 125 94 140 100"
            fill="none"
            className={getThemeClasses('gold')}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* 2. Horizontal Layout: Icon (X shifted by -10) + Texts on Right */}
      {layout === 'horizontal' && (
        <g>
          {/* Dome Mark shifted X by -10 (Center = 90) */}
          <g>
            <path
              d="M50 75C55 55 70 40 90 40C110 40 125 55 130 75"
              fill="none"
              className={cn('transition-colors duration-200', getThemeClasses('dome'))}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M90 40V31"
              fill="none"
              className={cn('transition-colors duration-200', getThemeClasses('dome'))}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle
              cx="90"
              cy="27"
              r="4"
              className={cn('transition-colors duration-200', getCircleThemeClasses())}
            />
            
            {/* Horizontal divider line in gold */}
            <path
              d="M145 78H360"
              fill="none"
              className={cn('transition-colors duration-200', getThemeClasses('gold'))}
              strokeWidth="1"
              strokeLinecap="round"
            />

            {/* Golden/Connectivity Curves */}
            <path
              d="M62 82C72 78 108 78 118 82"
              fill="none"
              className={getThemeClasses('gold')}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M56 91C68 86 112 86 124 91"
              fill="none"
              className={getThemeClasses('gold')}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M50 100C65 94 115 94 130 100"
              fill="none"
              className={getThemeClasses('gold')}
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>

          {/* Typography */}
          <text
            x="145"
            y="68"
            fontFamily="var(--font-kufi), 'Reem Kufi', 'Segoe UI', Roboto, sans-serif"
            fontWeight="700"
            fontSize="28"
          >
            <tspan className={cn('transition-colors duration-200', getThemeClasses('masjidku'))}>
              Masjidku
            </tspan>
            <tspan
              fontFamily="var(--font-sans), Poppins, 'Segoe UI', Roboto, sans-serif"
              fontWeight="600"
              className={getThemeClasses('online')}
            >
              {' '}Online
            </tspan>
          </text>

          {showTagline && (
            <text
              x="145"
              y="96"
              fontFamily="var(--font-sans), Poppins, 'Segoe UI', Roboto, sans-serif"
              fontWeight="400"
              fontSize="13"
              className={cn('transition-colors duration-200', getThemeClasses('tagline'))}
            >
              {tagline}
            </text>
          )}
        </g>
      )}

      {/* 3. Vertical/Stacked Layout: Icon Centered (X=120) + Stacked Texts Underneath */}
      {layout === 'vertical' && (
        <g>
          {/* Dome Mark Centered (Center = 120) */}
          <g>
            <path
              d="M80 75C85 55 100 40 120 40C140 40 155 55 160 75"
              fill="none"
              className={cn('transition-colors duration-200', getThemeClasses('dome'))}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M120 40V31"
              fill="none"
              className={cn('transition-colors duration-200', getThemeClasses('dome'))}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle
              cx="120"
              cy="27"
              r="4"
              className={cn('transition-colors duration-200', getCircleThemeClasses())}
            />

            {/* Golden/Connectivity Curves */}
            <path
              d="M92 82C102 78 138 78 148 82"
              fill="none"
              className={getThemeClasses('gold')}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M86 91C98 86 142 86 154 91"
              fill="none"
              className={getThemeClasses('gold')}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M80 100C95 94 145 94 160 100"
              fill="none"
              className={getThemeClasses('gold')}
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Horizontal divider line in gold (under the text baseline Y = 135) */}
            <path
              d="M50 142H190"
              fill="none"
              className={cn('transition-colors duration-200', getThemeClasses('gold'))}
              strokeWidth="1"
              strokeLinecap="round"
            />
          </g>

          {/* Typography */}
          <text
            x="120"
            y="135"
            textAnchor="middle"
            fontFamily="var(--font-kufi), 'Reem Kufi', 'Segoe UI', Roboto, sans-serif"
            fontWeight="700"
            fontSize="24"
          >
            <tspan className={cn('transition-colors duration-200', getThemeClasses('masjidku'))}>
              Masjidku
            </tspan>
            <tspan
              fontFamily="var(--font-sans), Poppins, 'Segoe UI', Roboto, sans-serif"
              fontWeight="600"
              className={getThemeClasses('online')}
            >
              {' '}Online
            </tspan>
          </text>

          {showTagline && (
            <text
              x="120"
              y="158"
              textAnchor="middle"
              fontFamily="var(--font-sans), Poppins, 'Segoe UI', Roboto, sans-serif"
              fontWeight="400"
              fontSize="10"
              className={cn('transition-colors duration-200', getThemeClasses('tagline'))}
            >
              {tagline}
            </text>
          )}
        </g>
      )}
    </svg>
  )
}

