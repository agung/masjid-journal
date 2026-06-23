import Image from 'next/image'
import { cn } from '@/lib/utils'

interface AppLogoProps {
  className?: string
  size?: number
}

/**
 * AppLogo component that renders the custom SVG logo from public/logo.svg.
 * Keeps the 4:3 aspect ratio (340x255) to display correctly in all sizes.
 */
export function AppLogo({ className, size = 48 }: AppLogoProps) {
  const width = Math.round(size * (4 / 3))

  return (
    <Image
      src="/logo.svg"
      alt="MasjidKu Online"
      width={width}
      height={size}
      style={{ width: '100%', height: 'auto', maxWidth: `${width}px`, maxHeight: `${size}px` }}
      className={cn('object-contain select-none', className)}
      priority
      unoptimized
    />
  )
}

