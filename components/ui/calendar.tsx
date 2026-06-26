'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3 bg-white dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-between pt-1 relative items-center px-1',
        caption_label: 'text-sm font-semibold text-gray-900 dark:text-gray-100',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border-gray-200 dark:border-gray-700'
        ),
        nav_button_previous: '',
        nav_button_next: '',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex justify-between',
        head_cell:
          'text-gray-400 rounded-md w-9 font-medium text-[0.75rem] dark:text-gray-500 text-center',
        row: 'flex w-full mt-2 justify-between',
        cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-lg [&:has([aria-selected].day-range-start)]:rounded-l-lg [&:has([aria-selected])]:bg-green-50 dark:[&:has([aria-selected])]:bg-green-950/20 first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg focus-within:relative focus-within:z-20',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg text-gray-700 dark:text-gray-300 flex items-center justify-center'
        ),
        day_range_end: 'day-range-end',
        day_selected:
          'bg-green-600 text-white hover:bg-green-600 hover:text-white focus:bg-green-600 focus:text-white dark:bg-green-600 dark:text-white rounded-lg',
        day_today: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 rounded-lg font-semibold',
        day_outside:
          'day-outside text-gray-400 opacity-40 aria-selected:bg-green-50/50 aria-selected:text-gray-400 aria-selected:opacity-30 dark:text-gray-600',
        day_disabled: 'text-gray-300 opacity-50 dark:text-gray-700',
        day_range_middle:
          'aria-selected:bg-green-50 aria-selected:text-green-700 dark:aria-selected:bg-green-950/20 dark:aria-selected:text-green-400 rounded-none',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn('h-4 w-4', className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn('h-4 w-4', className)} {...props} />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
