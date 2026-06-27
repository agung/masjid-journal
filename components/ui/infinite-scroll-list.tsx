'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface InfiniteScrollListProps<T> {
  initialItems: T[]
  fetchPage: (page: number) => Promise<T[]>
  renderItem: (item: T, index: number) => React.ReactNode
  renderSkeleton?: () => React.ReactNode
  pageSize?: number
  className?: string
  dependencies?: unknown[]
  emptyState?: React.ReactNode
}

export function InfiniteScrollList<T>({
  initialItems,
  fetchPage,
  renderItem,
  renderSkeleton,
  pageSize = 50,
  className = 'space-y-3',
  dependencies = [],
  emptyState,
}: InfiniteScrollListProps<T>) {
  const [items, setItems] = useState<T[]>(initialItems)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialItems.length >= pageSize)
  const [loading, setLoading] = useState(false)
  const observerRef = useRef<HTMLDivElement | null>(null)

  // Reset state when dependencies (filters, dates, active selections) change
  useEffect(() => {
    setItems(initialItems)
    setPage(1)
    setHasMore(initialItems.length >= pageSize)
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialItems, pageSize, ...dependencies])

  useEffect(() => {
    if (!hasMore || loading) return

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0]?.isIntersecting) {
          setLoading(true)
          try {
            const nextPage = page + 1
            const newItems = await fetchPage(nextPage)
            
            if (newItems.length > 0) {
              setItems((prev) => [...prev, ...newItems])
              setPage(nextPage)
              setHasMore(newItems.length >= pageSize)
            } else {
              setHasMore(false)
            }
          } catch (err) {
            console.error('[InfiniteScrollList] failed to fetch next page:', err)
            setHasMore(false)
          } finally {
            setLoading(false)
          }
        }
      },
      { threshold: 0.1, rootMargin: '150px' }
    )

    const currentObserverTarget = observerRef.current
    if (currentObserverTarget) {
      observer.observe(currentObserverTarget)
    }

    return () => {
      if (currentObserverTarget) {
        observer.unobserve(currentObserverTarget)
      }
    }
  }, [page, hasMore, loading, fetchPage, pageSize])

  if (items.length === 0) {
    return emptyState ?? null
  }

  return (
    <div className="space-y-4">
      <div className={className}>
        {items.map((item, index) => renderItem(item, index))}
      </div>

      {hasMore && (
        <div ref={observerRef} className="py-4 flex justify-center items-center">
          {loading ? (
            renderSkeleton ? (
              renderSkeleton()
            ) : (
              <Loader2 className="animate-spin text-green-600 dark:text-green-500" size={24} />
            )
          ) : (
            <div className="h-4" /> // Spacing to trigger observer
          )}
        </div>
      )}
    </div>
  )
}
