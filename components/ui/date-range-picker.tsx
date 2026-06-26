'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DateRangePickerProps {
  className?: string
  value?: DateRange
  onChange?: (dateRange: DateRange | undefined) => void
  placeholder?: string
}

export function DateRangePicker({
  className,
  value,
  onChange,
  placeholder = 'Pilih rentang tanggal',
}: DateRangePickerProps) {
  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal h-10 px-3 py-2 rounded-xl text-xs sm:text-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
              !value?.from && 'text-gray-400 dark:text-gray-500'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-gray-400 shrink-0" />
            <span className="truncate">
              {value?.from ? (
                value.to ? (
                  <>
                    {format(value.from, 'd MMM yyyy', { locale: id })} -{' '}
                    {format(value.to, 'd MMM yyyy', { locale: id })}
                  </>
                ) : (
                  format(value.from, 'd MMM yyyy', { locale: id })
                )
              ) : (
                <span>{placeholder}</span>
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onChange}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
