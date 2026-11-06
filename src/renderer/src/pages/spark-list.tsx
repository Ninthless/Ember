import { useCallback, useLayoutEffect, useRef, useState, type ReactNode, type UIEvent } from "react"
import { cn } from "@/lib/utils"

const thumbMin = 28

type Thumb = {
  top: number
  height: number
}

type Props = {
  className?: string
  children: ReactNode
}

export function SparkList({ className, children }: Props) {
  const scroller = useRef<HTMLUListElement>(null)
  const [thumb, setThumb] = useState<Thumb | null>(null)
  const [flash, setFlash] = useState(false)
  const hide = useRef(0)

  const measure = useCallback(() => {
    const node = scroller.current
    if (!node) {
      return
    }
    const room = node.clientHeight
    const span = node.scrollHeight
    if (span <= room + 1) {
      setThumb(null)
      return
    }
    const height = Math.max(thumbMin, (room / span) * room)
    const travel = room - height
    const top = travel * (node.scrollTop / (span - room))
    setThumb({ top, height })
  }, [])

  useLayoutEffect(() => {
    measure()
  }, [measure, children])

  const reveal = useCallback(() => {
    setFlash(true)
    window.clearTimeout(hide.current)
    hide.current = window.setTimeout(() => setFlash(false), 700)
  }, [])

  const onScroll = useCallback(
    (event: UIEvent<HTMLUListElement>) => {
      const node = event.currentTarget
      const room = node.clientHeight
      const span = node.scrollHeight
      if (span <= room + 1) {
        setThumb(null)
        return
      }
      const height = Math.max(thumbMin, (room / span) * room)
      const travel = room - height
      const top = travel * (node.scrollTop / (span - room))
      setThumb({ top, height })
      reveal()
    },
    [reveal]
  )

  return (
    <div className={cn("spark-scroll relative min-h-0 flex-1", className)}>
      <ul ref={scroller} tabIndex={0} onScroll={onScroll} className={cn("spark-list h-full outline-none", thumb && "pr-3")}>
        {children}
      </ul>
      {thumb ? (
        <div
          aria-hidden
          className={cn(
            "spark-thumb pointer-events-none absolute top-1 right-1.5 w-1.5 rounded-full",
            flash && "is-lit"
          )}
          style={{ height: thumb.height, transform: `translateY(${thumb.top}px)` }}
        />
      ) : null}
    </div>
  )
}
