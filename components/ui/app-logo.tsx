import Image from 'next/image'
import { cn } from '@/lib/utils'

interface AppLogoProps {
  className?: string
  size?: number
}

/**
 * AppLogo component that renders the custom SVG logo from public/logo.svg.
 * Keeps the 1.7 aspect ratio (680x400) to display correctly in all sizes.
 */
export function AppLogo({ className, size = 48 }: AppLogoProps) {
  const width = Math.round(size * 1.7)

  return (
    <Image
      src="/logo.svg"
      alt="MasjidKu Online"
      width={width}
      height={size}
      style={{ height: `${size}px`, width: `${width}px` }}
      className={cn('object-contain select-none', className)}
      priority
      unoptimized
    />
  )
}

